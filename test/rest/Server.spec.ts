import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import {expect} from "chai";
import request, {Response} from "supertest";
import * as fs from "fs";
import {clearDisk} from "../TestUtil";

describe("BIG Server Test", () => {

	let facade: InsightFacade;
	let server: Server;
	const ZIP_FILE_DATA = "test/resources/archives/pair.zip";
	const ZIP_FILE_DATA_ROOMS = "test/resources/archives/campus.zip";

	before( async () => {
		clearDisk();
		console.log("we made it inside before hook");
		facade = new InsightFacade();
		server = new Server(4321);
		// TODO: start server here once and handle errors properly
		await server.start();

	});

	after(async () => {
		// TODO: stop server here once!
		await server.stop();
	});

	beforeEach(() => {
		// might want to add some process logging here to keep track of what's going on
		console.log("we are in beforeEach");
	});

	afterEach(() => {
		// might want to add some process logging here to keep track of what's going on
	});

	// Sample on how to format PUT requests
	 it("PUT test for courses section dataset", async () => {
		 expect(fs.existsSync(ZIP_FILE_DATA)).to.be.true;
		try {
			return request("http://localhost:4321/")
				.put("dataset/sections/sections")
				.send(fs.readFileSync(ZIP_FILE_DATA))
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					console.log("res is: " + res.body);
					expect(res.status).to.be.equal(200);
					expect(Object.prototype.hasOwnProperty.call(res.body,"result")).to.be.true;
					expect(res.body["result"]).to.have.members(["sections"]);
					// more assertions here
				})
				.catch((err) => {
					// some logging here please!
					console.log("error!!: " + err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log("outer catch error: " + err);
			expect.fail();

		}
	});

	it("PUT test Rooms", async () => {
		expect(fs.existsSync(ZIP_FILE_DATA)).to.be.true;
		try {
			return request("http://localhost:4321/")
				.put("dataset/campus/rooms")
				.send(fs.readFileSync(ZIP_FILE_DATA_ROOMS))
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					console.log("res is: " + res.body);
					expect(res.status).to.be.equal(200);
					expect(Object.prototype.hasOwnProperty.call(res.body,"result")).to.be.true;
					expect(res.body["result"]).to.have.deep.members(["sections","campus"]);
					// more assertions here
				})
				.catch((err) => {
					// some logging here please!
					console.log("error!!: " + err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log("outer catch error: " + err);
			expect.fail();

		}
	});

	it("PUT test: Wrong kind", async () => {
		expect(fs.existsSync(ZIP_FILE_DATA_ROOMS)).to.be.true;
		try {
			return request("http://localhost:4321/")
				.put("dataset/campus/building")
				.send(fs.readFileSync(ZIP_FILE_DATA_ROOMS))
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					console.log("res is: " + res.body);
					expect(res.status).to.be.equal(400);
					expect(Object.prototype.hasOwnProperty.call(res.body, "result")).to.be.false;
					expect(res.body["result"]).to.equal(undefined);
					// more assertions here
				})
				.catch((err) => {
					// some logging here please!
					console.log("error!!: " + err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log("outer catch error: " + err);
			expect.fail();

		}
	});
	it("PUT test: dataset has been added already",
		async () => {
			expect(fs.existsSync(ZIP_FILE_DATA)).to.be.true;
			try {
				request("http://localhost:4321/")
					.put("dataset/secondsections/sections")
					.send(fs.readFileSync(ZIP_FILE_DATA))
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						console.log("res is: " + res.body);
						expect(res.status).to.be.equal(200);
						expect(Object.prototype.hasOwnProperty.call(res.body, "result")).to.be.true;
						expect(res.body["result"]).to.have.members(["campus"]);
						// more assertions here
					})
					.catch((err) => {
						// some logging here please!
						console.log("error1 above: " + err);
						expect.fail();
					});

				return request("http://localhost:4321/")
					.put("dataset/sections/sections")
					.send(fs.readFileSync(ZIP_FILE_DATA))
					.set("Content-Type", "application/x-zip-compressed")
					.then((res: Response) => {
						console.log("res is: " + res.body);
						expect(res.status).to.be.equal(400);
						expect(Object.prototype.hasOwnProperty.call(res.body, "result")).to.be.false;
						expect(res.body["result"]).to.equal(undefined);
						// more assertions here
					})
					.catch((err) => {
						// some logging here please!
						console.log("error2: " + err);
						expect.fail();
					});
			} catch (err) {
				// and some more logging here!
				console.log("outer catch error: " + err);
				expect.fail();

			}
		});
	it("GET all Dataset", async () => {
		expect(fs.existsSync(ZIP_FILE_DATA)).to.be.true;
		try {
			return request("http://localhost:4321/")
				.get("datasets")
				.then((res: Response) => {
					console.log("res is: " + JSON.stringify(res.body));
					expect(res.status).to.be.equal(200);
					expect(Object.prototype.hasOwnProperty.call(res.body,"result")).to.be.true;
					expect(res.body["result"].length).to.equal(3);
					// more assertions here
				})
				.catch((err) => {
					// some logging here please!
					console.log("error!!: " + err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log("outer catch error: " + err);
			expect.fail();

		}
	});

	it("DEL 1st dataset", async () => {
		expect(fs.existsSync(ZIP_FILE_DATA)).to.be.true;
		try {
			return request("http://localhost:4321/")
				.delete("dataset/sections")
				.then((res: Response) => {
					console.log("res is: " + JSON.stringify(res.body));
					expect(res.status).to.be.equal(200);
					expect(Object.prototype.hasOwnProperty.call(res.body,"result")).to.be.true;
					expect(res.body["result"]).to.deep.equal("sections");
					// more assertions here
				})
				.catch((err) => {
					// some logging here please!
					console.log("error!!: " + err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log("outer catch error: " + err);
			expect.fail();

		}
	});

	it("DEL unexistent dataset", async () => {
		expect(fs.existsSync(ZIP_FILE_DATA)).to.be.true;
		try {
			return request("http://localhost:4321/")
				.delete("dataset/sections")
				.then((res: Response) => {
					console.log("res is: " + JSON.stringify(res.body));
					expect(res.status).to.be.equal(404);
					expect(Object.prototype.hasOwnProperty.call(res.body,"error")).to.be.true;
					expect(res.body["error"]).to.deep.equal("dataset with the idsections doesn't exist");
					// more assertions here
				})
				.catch((err) => {
					// some logging here please!
					console.log("error!!: " + err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log("outer catch error: " + err);
			expect.fail();

		}
	});

	it("DEL invalid dataset", async () => {
		expect(fs.existsSync(ZIP_FILE_DATA)).to.be.true;
		try {
			return request("http://localhost:4321/")
				.delete("dataset/_campus")
				.then((res: Response) => {
					console.log("res is: " + JSON.stringify(res.body));
					expect(res.status).to.be.equal(400);
					expect(Object.prototype.hasOwnProperty.call(res.body,"error")).to.be.true;
					//	expect(res.body["error"]).to.deep.equal("dataset with the idsections doesn't exist");
					// more assertions here
				})
				.catch((err) => {
					// some logging here please!
					console.log("error!!: " + err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log("outer catch error: " + err);
			expect.fail();

		}
	});

	it("DEL delete datasets till u can't no mo", async () => {
		expect(fs.existsSync(ZIP_FILE_DATA)).to.be.true;
		try {
			request("http://localhost:4321/")
				.delete("dataset/campus")
				.then((res: Response) => {
					console.log("res is: " + JSON.stringify(res.body));
					expect(res.status).to.be.equal(200);
					expect(Object.prototype.hasOwnProperty.call(res.body,"result")).to.be.true;
					//	expect(res.body["error"]).to.deep.equal("dataset with the idsections doesn't exist");
					// more assertions here
				})
				.catch((err) => {
					// some logging here please!
					console.log("error1: " + err);
					expect.fail();
				});

			 request("http://localhost:4321/")
				.delete("dataset/secondsections")
				.then((res: Response) => {
					console.log("res is: " + JSON.stringify(res.body));
					expect(res.status).to.be.equal(200);
					expect(Object.prototype.hasOwnProperty.call(res.body,"result")).to.be.true;
					expect(res.body["result"]).to.deep.equal("secondsections");
					// more assertions here
				})
				.catch((err) => {
					// some logging here please!
					console.log("error2: " + err);
					expect.fail();
				});

			return request("http://localhost:4321/")
				.delete("dataset/")
				.then((res: Response) => {
					console.log("res is: " + JSON.stringify(res.body));
					expect(res.status).to.be.equal(400);
					expect(Object.prototype.hasOwnProperty.call(res.body,"error")).to.be.true;
					//	expect(res.body["result"]).to.deep.equal("secondsections");
					// more assertions here
				})
				.catch((err) => {
					// some logging here please!
					console.log("error3: " + err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log("outer catch error: " + err);
			expect.fail();

		}
	});
	// The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
