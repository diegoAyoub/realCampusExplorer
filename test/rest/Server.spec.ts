import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import {expect} from "chai";
import request, {Response} from "supertest";
import * as fs from "fs";

describe("PUT Server Tests", () => {

	let facade: InsightFacade;
	let server: Server;
	const ZIP_FILE_DATA = "test/resources/archives/pair.zip";

	before( async () => {
		console.log("we made it inside before hook");
		facade = new InsightFacade();
		server = new Server(4321);
		// TODO: start server here once and handle errors properly
		server.start().then(() => {
			console.info("TEST::initServer() - started");
			// Promise.resolve();
		}).catch((err: Error) => {
			console.error(`TEST::initServer() - ERROR: ${err.message}`);
			// Promise.reject();
		});

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
				.put("http://localhost:4321/dataset/sections/sections")
				.send(fs.readFileSync("test/resources/archives/pair.zip"))
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					console.log("res is: " + res.body);
					expect(res.status).to.be.equal(200);
					expect(Object.prototype.hasOwnProperty.call(res,"results")).to.be.true;
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


	// The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
