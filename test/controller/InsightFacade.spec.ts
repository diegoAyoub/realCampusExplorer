import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
import InsightFacade from "../../src/controller/InsightFacade";
import {clearDisk, getContentFromArchives} from "../resources/archives/TestUtil";
import {
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import {folderTest} from "@ubccpsc310/folder-test";

chai.use(chaiAsPromised);
// mutation testing -> UnitTests(input, correct_implementation) != unitTests(input, mutated_implementation)
type Output = InsightResult[];
type Input = object;
type Error = "ResultTooLargeError" | "InsightError";

// ebnf tests vs performQueryTests
// add tests for performquery where query references two datasets.
// cleardisk isn't working locally

describe("InsightFacade", function () {
	let facade: InsightFacade;
	let newFacade: InsightFacade;
	let validSection: string;
	let invalidSectionMissingQueryKeyAvg: string;
	let validClass: string;
	let invalidClassImproperRootDir: string;
	let invalidClassNoValidSections: string;
	let invalidClassNotJsonFile: string;
	let invalidClassResultKeyError: string;
	let validDataset: string;
	let validRoomDataset: string;
	let invalidDatasetNotZip: string;
	let invalidDatasetNoValidSection: string;
	before(function () {
		validSection = getContentFromArchives("valid_section.zip");
		invalidSectionMissingQueryKeyAvg = getContentFromArchives("invalid_section_missing_query_key_avg.zip");

		validClass = getContentFromArchives("CPSC418.zip");
		invalidClassImproperRootDir = getContentFromArchives("invalid_class_improper_root_dir.zip");
		invalidClassNoValidSections = getContentFromArchives("invalid_class_no_valid_sections.zip");
		invalidClassNotJsonFile = getContentFromArchives("invalid_class_not_json_file.zip");
		invalidClassResultKeyError = getContentFromArchives("invalid_class_result_key_error.zip");
		validDataset = getContentFromArchives("pair.zip");
		validRoomDataset = getContentFromArchives("campus.zip");
		invalidDatasetNotZip = getContentFromArchives("invalid_dataset_not_zip.txt");
		invalidDatasetNoValidSection = getContentFromArchives("invalid_dataset_no_valid_section.zip");
	});

	describe("addDatasetTests", function () {
		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		describe("ID argument tests", function () {
			it("should reject due to an empty dataset id", function () {
				const result = facade.addDataset("", validDataset, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});

			it("should reject due to _ being the id", function () {
				const result = facade.addDataset("_", validDataset, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});

			it("should reject due to __ being the id", function () {
				const result = facade.addDataset("__", validDataset, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});

			it("should reject because the id is just whitespaces", function () {
				const result = facade.addDataset("  ", validDataset, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});

			it("should reject because the id is already added", function () {
				return facade
					.addDataset("cpsc", validDataset, InsightDatasetKind.Sections)
					.then(() => {
						return facade.addDataset("cpsc", validDataset, InsightDatasetKind.Sections);
					})
					.then(() => expect.fail("Promise was resolved but should've failed"))
					.catch((err: Error) => expect(err).to.be.instanceOf(InsightError));
			});

			it("should pass because the id is valid", function () {
				const result = facade.addDataset("section", validDataset, InsightDatasetKind.Sections);
				return expect(result).eventually.to.have.members(["section"]);
			});

			it("should pass because the dataset was successfully added", function () {
				const result = facade.addDataset("section", validDataset, InsightDatasetKind.Sections);
				return expect(result).eventually.to.have.members(["section"]);
			});

			// it("should psas because", function() {
			// 	return facade.addDataset("section", validDataset, InsightDatasetKind.Sections)
			// 		.then(() => facade.addDataset("section____hello_", validSection, InsightDatasetKind.Sections))
			// 		.catch(() => {
			// 			// let newFacade = new InsightFacade(); // check that
			// 			// facaade.addDataset("blah");
			// 			// newFacade.performQuery(); // new facade should only have datasetid = section
			// 			// return newFacade.listDatasets();
			// 		});
			// });

			it("should pass because it successfully added two datasets", function () {
				return facade
					.addDataset("dataset", validDataset, InsightDatasetKind.Sections)
					.then(() => {
						return facade.addDataset("class", validClass, InsightDatasetKind.Sections);
					})
					.then((res: string[]) => {
						expect(res).to.have.members(["dataset", "class"]);
					})
					.catch(() => expect.fail());
			});
		});

		describe("Content argument tests", function () {
			it("should pass because the dataset is a zip file containing one or more valid sections", function () {
				const result = facade.addDataset("course", validDataset, InsightDatasetKind.Sections);
				return expect(result).to.eventually.have.members(["course"]);
			});

			it(
				"should pass because the class (from the content argument) is a JSON formatted file that contain " +
					"one or more valid sections in a directory called courses/ in the root directory",
				function () {
					const result = facade.addDataset("courses", validClass, InsightDatasetKind.Sections);
					return expect(result).to.eventually.have.members(["courses"]);
				}
			);

			it("should pass because the section has all the necessary keys for a query", function () {
				const result = facade.addDataset("anothercourse", validSection, InsightDatasetKind.Sections);
				return expect(result).to.eventually.have.members(["anothercourse"]);
			});

			it("should fail because the root dir of the class doesn't have a directory named courses", function () {
				const result = facade.addDataset("ubc", invalidClassImproperRootDir, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});

			it("should fail because the class has no valid sections", function () {
				const result = facade.addDataset("ubc", invalidClassNoValidSections, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});

			it("should fail because the class is not a json file", function () {
				const result = facade.addDataset("ubc", invalidClassNotJsonFile, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});

			it("should fail because the class does not have [result] as a key", function () {
				const result = facade.addDataset("ubc", invalidClassResultKeyError, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});

			it("should fail because the dataset has no valid sections", function () {
				const result = facade.addDataset("ubc", invalidDatasetNoValidSection, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});

			it("should fail because the dataset is not a zip file", function () {
				const result = facade.addDataset("ubc", invalidDatasetNotZip, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});

			it("should fail because the section is missing the key: [avg]", function () {
				const result = facade.addDataset("ubc", invalidClassImproperRootDir, InsightDatasetKind.Sections);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});


		});

		describe("Content argument tests for rooms", function () {
			it("should pass because the dataset is a zip file containing one or more valid sections", function () {
				const result = facade.addDataset("course", validDataset, InsightDatasetKind.Sections);
				return expect(result).to.eventually.have.members(["course"]);
			});

			it(
				"should pass because the class (from the content argument) is a JSON formatted file that contain " +
				"one or more valid sections in a directory called courses/ in the root directory",
				function () {
					const result = facade.addDataset("courses", validClass, InsightDatasetKind.Sections);
					return expect(result).to.eventually.have.members(["courses"]);
				}
			);

		});

		describe("Kind argument tests", function () {
			it("should reject because the kind(from the kind argument) is room, it is not supported yet", function () {
				const result = facade.addDataset("ubc", validDataset, InsightDatasetKind.Rooms);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});

			it("should pass because the kind(from the kind argument) is section which is supported", function () {
				const result = facade.addDataset("ubc", validDataset, InsightDatasetKind.Sections);
				return expect(result).to.eventually.have.members(["ubc"]);
			});
		});
	});

	describe("removeDatasetTests", function () {
		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should pass because it removed the dataset with the given id", function () {
			return facade.addDataset("ubc", validDataset, InsightDatasetKind.Sections)
				.then(() => facade.addDataset("validSection", validSection, InsightDatasetKind.Sections))
				.then(() => {
					return facade.removeDataset("validSection");
				})
				.then((result: string) => {
					expect(result).to.equal("validSection");
				})
				.catch(() => expect.fail("Promise should have resolved but was rejected instead"));
		});

		it("should reject with NotFoundError because it was given a valid id string that does not exist", function () {
			return facade
				.addDataset("ubc", validDataset, InsightDatasetKind.Sections)
				.then(() => {
					return facade.removeDataset("ubccc");
				})
				.then(() => {
					expect.fail("Promise should have rejected but resolved instead");
				})
				.catch((err) => {
					expect(err).to.be.instanceOf(NotFoundError);
				});
		});

		it("should reject because it was given an idstring that is an _", function () {
			const result = facade.removeDataset("_");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject because it was given an idstring that is __", function () {
			const result = facade.removeDataset("__");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject because it was given an idstring that is just whitespace", function () {
			const result = facade.removeDataset("  ");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject because it was given an id string that contains an _ ", function () {
			const result = facade.removeDataset("sections_");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
	});

	describe("listDatasetTests", function () {
		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should pass with no datasets because no datasets were added", function () {
			const result = facade.listDatasets();
			return expect(result).to.eventually.be.fulfilled.with.length(0);
		});

		it("should pass because it shows the dataset that was added", function () {
			return facade
				.addDataset("ubc", validDataset, InsightDatasetKind.Sections)
				.then(() => {
					return facade.listDatasets();
				})
				.then((datasets: InsightDataset[]) => {
					expect(datasets).to.have.deep.members([
						{
							id: "ubc",
							kind: InsightDatasetKind.Sections,
							numRows: 64612,
						},
					]);
				})
				.catch(() => {
					expect.fail("should have passed");
				});
		});

		it("should pass with no datasets after one was added because the added dataset was removed", function () {
			return facade
				.addDataset("dataset", validDataset, InsightDatasetKind.Sections)
				.then(() => {
					return facade.removeDataset("dataset");
				})
				.then((res: string) => {
					expect(res).to.equal("dataset");
					return facade.listDatasets();
				})
				.then((datasets: InsightDataset[]) => {
					expect(datasets).to.have.length(0);
				})
				.catch(() => {
					expect.fail("should have passed");
				});
		});

		it("should pass with two datasets (dataset and class) because those two were added", function () {
			return facade
				.addDataset("dataset", validDataset, InsightDatasetKind.Sections)
				.then(() => {
					return facade.addDataset("class", validClass, InsightDatasetKind.Sections);
				})
				.then((res: string[]) => {
					expect(res).to.have.deep.members(["dataset", "class"]);
					return facade.listDatasets();
				})
				.then((res: InsightDataset[]) => {
					expect(res).to.have.deep.members([
						{
							id: "class",
							kind: InsightDatasetKind.Sections,
							numRows: 6,
						},
						{
							id: "dataset",
							kind: InsightDatasetKind.Sections,
							numRows: 64612,
						},
					]);
				})
				.catch(() => {
					expect.fail("Promise rejected but should've resolved");
				});
		});
	});

	describe("performQuery - c1", function () {
		before(async function () {
			clearDisk();
			facade = new InsightFacade();
			await facade.addDataset("sections", validDataset, InsightDatasetKind.Sections);
			await facade.addDataset("classes", validClass, InsightDatasetKind.Sections);
		});

		function errorValidator(error: any): error is Error {
			return error === "InsightError" || error === "ResultTooLargeError";
		}

		function assertOnError(actual: any, expected: Error): void {
			if (expected === "InsightError") {
				expect(actual).to.be.instanceof(InsightError);
			} else if (expected === "ResultTooLargeError") {
				expect(actual).to.be.instanceof(ResultTooLargeError);
			} else {
				// this should be unreachable
				expect.fail("UNEXPECTED ERROR");
			}
		}

		function assertOnResult(actual: unknown, expected: Output): void {
			expect(actual).to.have.deep.members(expected);
		}

		function target(input: Input): Promise<Output> {
			return facade.performQuery(input);
		}

		folderTest<Input, Output, Error>("PerformQuery Tests", target, "./test/resources/sectionqueries", {
			errorValidator,
			assertOnError,
			assertOnResult,
		});
	});

	describe("performQuery - c2", function () {
		before(async function () {
			clearDisk();
			facade = new InsightFacade();
			await facade.addDataset("classes", validClass, InsightDatasetKind.Sections);
			await facade.addDataset("rooms", validRoomDataset, InsightDatasetKind.Rooms);
			await facade.addDataset("sections", validDataset, InsightDatasetKind.Sections);
			newFacade = new InsightFacade();
		});

		function errorValidator(error: any): error is Error {
			return error === "InsightError" || error === "ResultTooLargeError";
		}

		function assertOnError(actual: any, expected: Error): void {
			if (expected === "InsightError") {
				expect(actual).to.be.instanceof(InsightError);
			} else if (expected === "ResultTooLargeError") {
				expect(actual).to.be.instanceof(ResultTooLargeError);
			} else {
				// this should be unreachable
				expect.fail("UNEXPECTED ERROR");
			}
		}

		function assertOnResult(actual: unknown, expected: Output): void {
			expect(actual).to.have.deep.equal(expected);
		}

		function target(input: Input): Promise<Output> {
			// console.log(input);
			return newFacade.performQuery(input);
		}

		folderTest<Input, Output, Error>("PerformQuery Tests", target, "./test/resources/roomqueries", {
			errorValidator,
			assertOnError,
			assertOnResult,
		});
	});

	describe("performQuery - matching types in where and applykey", function () {
		before(async function () {
			clearDisk();
			facade = new InsightFacade();
			await facade.addDataset("classes", validClass, InsightDatasetKind.Sections);
			await facade.addDataset("rooms", validRoomDataset, InsightDatasetKind.Rooms);
			await facade.addDataset("sections", validDataset, InsightDatasetKind.Sections);
			newFacade = new InsightFacade();
		});

		function errorValidator(error: any): error is Error {
			return error === "InsightError" || error === "ResultTooLargeError";
		}

		function assertOnError(actual: any, expected: Error): void {
			if (expected === "InsightError") {
				expect(actual).to.be.instanceof(InsightError);
			} else if (expected === "ResultTooLargeError") {
				expect(actual).to.be.instanceof(ResultTooLargeError);
			} else {
				// this should be unreachable
				expect.fail("UNEXPECTED ERROR");
			}
		}

		function assertOnResult(actual: unknown, expected: Output): void {
			expect(actual).to.have.length.gte(0); // as long as it doesn't reject its good
		}

		function target(input: Input): Promise<Output> {
			// console.log(input);
			return newFacade.performQuery(input);
		}

		folderTest<Input, Output, Error>("PerformQuery Tests", target, "./test/resources/failingtests", {
			errorValidator,
			assertOnError,
			assertOnResult,
		});
	});

	describe("performQuery - failingtests", function () {
		before(async function () {
			clearDisk();
			facade = new InsightFacade();
			await facade.addDataset("classes", validClass, InsightDatasetKind.Sections);
			await facade.addDataset("rooms", validRoomDataset, InsightDatasetKind.Rooms);
			await facade.addDataset("sections", validDataset, InsightDatasetKind.Sections);
			newFacade = new InsightFacade();
		});

		function errorValidator(error: any): error is Error {
			return error === "InsightError" || error === "ResultTooLargeError";
		}

		function assertOnError(actual: any, expected: Error): void {
			if (expected === "InsightError") {
				expect(actual).to.be.instanceof(InsightError);
			} else if (expected === "ResultTooLargeError") {
				expect(actual).to.be.instanceof(ResultTooLargeError);
			} else {
				// this should be unreachable
				expect.fail("UNEXPECTED ERROR");
			}
		}

		function assertOnResult(actual: unknown, expected: Output): void {
			expect(actual).to.have.length.gte(1);
		}

		function target(input: Input): Promise<Output> {
			// console.log(input);
			return newFacade.performQuery(input);
		}

		folderTest<Input, Output, Error>("PerformQuery Tests", target, "./test/resources/unorderedqueries", {
			errorValidator,
			assertOnError,
			assertOnResult,
		});
	});


});
