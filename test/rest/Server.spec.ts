import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import {expect} from "chai";
import request, {Response} from "supertest";
import * as fs from "fs";
import {clearDisk} from "../TestUtil";


describe("BIG Server Test", () => {

	let facade: InsightFacade;
	let server: Server;
	const SERVER_URL = "http://localhost:4321/";
	const ZIP_FILE_DATA_SECTIONS = "test/resources/archives/pair.zip";
	const INVALID_ZIP_FILE_SECTIONS = "test/resources/archives/invalid_section_missing_query_key_avg.zip";
	const ZIP_FILE_DATA_ROOMS = "test/resources/archives/campus.zip";
	const INVALID_ZIP_FILE_ROOMS = "test/resources/archives/campus_no_index_htm.zip";

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
		// await server.stop();
	});

	beforeEach(() => {
		// might want to add some process logging here to keep track of what's going on
		// console.log("we are in beforeEach");
	});

	afterEach(() => {
		// might want to add some process logging here to keep track of what's going on
	});

	describe("PUT Dataset Tests: addDataset()", function() {
		// Sample on how to format PUT requests
		it("Adds a Sections dataset", async () => {
			expect(fs.existsSync(ZIP_FILE_DATA_SECTIONS)).to.be.true;
			try {
				return request(SERVER_URL)
					.put("dataset/sections/sections")
					.send(fs.readFileSync(ZIP_FILE_DATA_SECTIONS))
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

		it("Adds a Rooms dataset and a sections dataset", async function () {
			expect(fs.existsSync(ZIP_FILE_DATA_SECTIONS)).to.be.true;
			try {
				let result: Response = await request(SERVER_URL)
					.put("dataset/campus/rooms")
					.send(fs.readFileSync(ZIP_FILE_DATA_ROOMS))
					.set("Content-Type", "application/x-zip-compressed");

				console.log("res is: " + result.body);
				expect(result.status).to.be.equal(200);
				expect(Object.prototype.hasOwnProperty.call(result.body,"result")).to.be.true;
				expect(result.body["result"]).to.have.deep.members(["campus", "sections"]);
					// more assertions here
				result = await request(SERVER_URL)
					.put("dataset/sections/sections")
					.send(fs.readFileSync(ZIP_FILE_DATA_SECTIONS))
					.set("Content-Type", "application/x-zip-compressed");

				console.log("res is: " + result.body);
				expect(result.status).to.be.equal(400);
				expect(Object.prototype.hasOwnProperty.call(result.body,"error")).to.be.true;
			} catch(err) {
				// some logging here please!
				console.log("error!!: " + err);
				expect.fail();
			}
		});

		it("Adds a dataset kind that doesn't exist (building)", async function() {
			expect(fs.existsSync(ZIP_FILE_DATA_ROOMS)).to.be.true;
			try {
				let res = await request(SERVER_URL)
					.put("dataset/campus/building")
					.send(fs.readFileSync(ZIP_FILE_DATA_ROOMS))
					.set("Content-Type", "application/x-zip-compressed");
				console.log("res is: " + res.body);
				expect(res.status).to.be.equal(400);
				expect(Object.prototype.hasOwnProperty.call(res.body, "result")).to.be.false;
				expect(Object.prototype.hasOwnProperty.call(res.body, "error")).to.be.true;
				expect(res.body["result"]).to.equal(undefined);
						// more assertions here
			} catch (err) {
				// and some more logging here!
				console.log("outer catch error: " + err);
				expect.fail();

			}
		});
		it("Attempts to add a sections database but passes in a rooms dataset",async function(){
			expect(fs.existsSync(ZIP_FILE_DATA_SECTIONS)).to.be.true;
			try {
				let result: Response = await request(SERVER_URL)
					.put("dataset/section/sections")
					.send(fs.readFileSync(ZIP_FILE_DATA_ROOMS))
					.set("Content-Type", "application/x-zip-compressed");

				console.log("res is: " + result.body);
				console.log("res is: " + result.body);
				expect(result.status).to.be.equal(400);
				expect(Object.prototype.hasOwnProperty.call(result.body,"error")).to.be.true;
				// more assertions here
			} catch(err) {
				// some logging here please!
				console.log("error!!: " + err);
				expect.fail();
			}
		});

		it("Attempts to add a rooms database but passes in a sections dataset",async function(){
			expect(fs.existsSync(ZIP_FILE_DATA_SECTIONS)).to.be.true;
			try {
				let result: Response = await request(SERVER_URL)
					.put("dataset/rooms/sections")
					.send(fs.readFileSync(ZIP_FILE_DATA_ROOMS))
					.set("Content-Type", "application/x-zip-compressed");

				console.log("res is: " + result.body);
				console.log("res is: " + result.body);
				expect(result.status).to.be.equal(400);
				expect(Object.prototype.hasOwnProperty.call(result.body,"error")).to.be.true;
				// more assertions here
			} catch(err) {
				// some logging here please!
				console.log("error!!: " + err);
				expect.fail();
			}
		});

		it("Attempts to add a rooms database but passes in a sections dataset",async function(){
			expect(fs.existsSync(ZIP_FILE_DATA_SECTIONS)).to.be.true;
			try {
				let result: Response = await request(SERVER_URL)
					.put("dataset/rooms/sections")
					.send(fs.readFileSync(ZIP_FILE_DATA_ROOMS))
					.set("Content-Type", "application/x-zip-compressed");

				console.log("res is: " + result.body);
				console.log("res is: " + result.body);
				expect(result.status).to.be.equal(400);
				expect(Object.prototype.hasOwnProperty.call(result.body,"error")).to.be.true;
				// more assertions here
			} catch(err) {
				// some logging here please!
				console.log("error!!: " + err);
				expect.fail();
			}
		});

		it("Attempts to add a sections database with a bad ID",async function(){
			expect(fs.existsSync(ZIP_FILE_DATA_SECTIONS)).to.be.true;
			try {
				let result: Response = await request(SERVER_URL)
					.put("dataset/sec_tions/sections")
					.send(fs.readFileSync(ZIP_FILE_DATA_SECTIONS))
					.set("Content-Type", "application/x-zip-compressed");

				console.log("res is: " + result.body);
				console.log("res is: " + result.body);
				expect(result.status).to.be.equal(400);
				expect(Object.prototype.hasOwnProperty.call(result.body,"error")).to.be.true;
				// more assertions here
			} catch(err) {
				// some logging here please!
				console.log("error!!: " + err);
				expect.fail();
			}
		});

		it("Attempts to add a rooms database with a bad ID",async function(){
			expect(fs.existsSync(ZIP_FILE_DATA_SECTIONS)).to.be.true;
			try {
				let result: Response = await request(SERVER_URL)
					.put("dataset/ro_oms/rooms")
					.send(fs.readFileSync(ZIP_FILE_DATA_ROOMS))
					.set("Content-Type", "application/x-zip-compressed");

				console.log("res is: " + result.body);
				console.log("res is: " + result.body);
				expect(result.status).to.be.equal(400);
				expect(Object.prototype.hasOwnProperty.call(result.body,"error")).to.be.true;
				// more assertions here
			} catch(err) {
				// some logging here please!
				console.log("error!!: " + err);
				expect.fail();
			}
		});

		it("Attempts to add a sections database with an invalid zip file",async function(){
			expect(fs.existsSync(ZIP_FILE_DATA_SECTIONS)).to.be.true;
			try {
				let result: Response = await request(SERVER_URL)
					.put("dataset/section/sections")
					.send(fs.readFileSync(INVALID_ZIP_FILE_SECTIONS))
					.set("Content-Type", "application/x-zip-compressed");

				console.log("res is: " + result.body);
				console.log("res is: " + result.body);
				expect(result.status).to.be.equal(400);
				expect(Object.prototype.hasOwnProperty.call(result.body,"error")).to.be.true;
				// more assertions here
			} catch(err) {
				// some logging here please!
				console.log("error!!: " + err);
				expect.fail();
			}
		});

		it("Attempts to add a rooms database with an invalid zip file",async function(){
			expect(fs.existsSync(ZIP_FILE_DATA_SECTIONS)).to.be.true;
			try {
				let result: Response = await request(SERVER_URL)
					.put("dataset/rooms/rooms")
					.send(fs.readFileSync(INVALID_ZIP_FILE_ROOMS))
					.set("Content-Type", "application/x-zip-compressed");

				console.log("res is: " + result.body);
				console.log("res is: " + result.body);
				expect(result.status).to.be.equal(400);
				expect(Object.prototype.hasOwnProperty.call(result.body,"error")).to.be.true;
				// more assertions here
			} catch(err) {
				// some logging here please!
				console.log("error!!: " + err);
				expect.fail();
			}
		});
	});

	describe("Delete Dataset Tests: removeDataset()", function() {
		it("DEL dataset with id = sections", async () => {
			expect(fs.existsSync(ZIP_FILE_DATA_SECTIONS)).to.be.true;
			try {
				let res = await request(SERVER_URL)
					.delete("dataset/sections");
				console.log("res is: " + JSON.stringify(res.body));
				expect(res.status).to.be.equal(200);
				expect(Object.prototype.hasOwnProperty.call(res.body,"result")).to.be.true;
				expect(res.body["result"]).to.deep.equal("sections");
				// more assertions here
			} catch (err) {
				// and some more logging here!
				console.log("outer catch error: " + err);
				expect.fail();

			}
		});

		it("should fail to delete sections again ", async () => {
			expect(fs.existsSync(ZIP_FILE_DATA_SECTIONS)).to.be.true;
			try {
				let res = await request(SERVER_URL)
					.delete("dataset/sections");
				console.log("res is: " + JSON.stringify(res.body));
				expect(res.status).to.be.equal(404);
				expect(Object.prototype.hasOwnProperty.call(res.body,"error")).to.be.true;
				expect(res.body["error"]).to.deep.equal("dataset with the idsections doesn't exist");
				// more assertions here
			} catch (err) {
				// and some more logging here!
				console.log("outer catch error: " + err);
				expect.fail();

			}
		});

		it("should fail to delete a dataset with invalid id of _campus", async () => {
			expect(fs.existsSync(ZIP_FILE_DATA_SECTIONS)).to.be.true;
			try {
				let res = await request(SERVER_URL)
					.delete("dataset/_campus");
				console.log("res is: " + JSON.stringify(res.body));
				expect(res.status).to.be.equal(400);
				expect(Object.prototype.hasOwnProperty.call(res.body,"error")).to.be.true;
				//	expect(res.body["error"]).to.deep.equal("dataset with the idsections doesn't exist");
				// more assertions here
			} catch (err) {
				// and some more logging here!
				console.log("outer catch error: " + err);
				expect.fail();

			}
		});

		it("DEL delete datasets till u can't no mo", async () => {
			expect(fs.existsSync(ZIP_FILE_DATA_SECTIONS)).to.be.true;
			try {
				let res: Response = await request(SERVER_URL)
					.delete("dataset/rooms");
				console.log("res is: " + JSON.stringify(res.body));
				expect(res.status).to.be.equal(200);
				expect(Object.prototype.hasOwnProperty.call(res.body,"result")).to.be.true;
						//	expect(res.body["error"]).to.deep.equal("dataset with the idsections doesn't exist");
						// more assertions here

				res = await request(SERVER_URL)
					.delete("dataset/nonexistent");
				console.log("res is: " + JSON.stringify(res.body));
				expect(res.status).to.be.equal(404);
				expect(Object.prototype.hasOwnProperty.call(res.body,"error")).to.be.true;

				res = await  request(SERVER_URL)
					.delete("dataset/invalid_id");
				console.log("res is: " + JSON.stringify(res.body));
				expect(res.status).to.be.equal(400);
				expect(Object.prototype.hasOwnProperty.call(res.body,"error")).to.be.true;
				//	expect(res.body["result"]).to.deep.equal("secondsections");
				// more assertions here
						// some logging here please!

			} catch (err) {
				// and some more logging here!
				console.log("outer catch error: " + err);
				expect.fail();

			}
		});
	});


	describe("Get Dataset Tests: listDatasets()", function() {
		it("GET all Dataset", async () => {
			expect(fs.existsSync(ZIP_FILE_DATA_SECTIONS)).to.be.true;
			try {
				let res = await  request(SERVER_URL)
					.get("datasets");
				console.log("res is: " + JSON.stringify(res.body));
				expect(res.status).to.be.equal(200);
				expect(Object.prototype.hasOwnProperty.call(res.body,"result")).to.be.true;
				expect(res.body["result"].length).to.equal(1);
			} catch (err) {
				// and some more logging here!
				console.log("outer catch error: " + err);
				expect.fail();

			}
		});
	});
	// describe("Post Dataset Tests: performQuery()", function() {
	// });


	// The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});

