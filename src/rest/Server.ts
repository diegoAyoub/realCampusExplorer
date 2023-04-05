import express, {Application, Request, Response} from "express";

import * as http from "http";
import cors from "cors";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, InsightError, NotFoundError} from "../controller/IInsightFacade";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;
	private static insightFacade: null | InsightFacade;

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		console.log("port is: " + port);
		this.express = express();
		Server.insightFacade = null;
		this.registerMiddleware();
		this.registerRoutes();

		/** NOTE: you can serve static frontend files in from your express server
		 * by uncommenting the line below. This makes files in ./frontend/public
		 * accessible at http://localhost:<port>/
		 */
		// this.express.use(express.static("./frontend/public"))
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		return new Promise((resolve, reject) => {
			console.info("Server::start() - start");
			if (this.server !== undefined) {
				console.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express.listen(this.port, () => {
					console.info(`Server::start() - server listening on port: ${this.port}`);
					Server.insightFacade = new InsightFacade();
					resolve();
				}).on("error", (err: Error) => {
					// catches errors in server start
					console.error(`Server::start() - server ERROR: ${err.message}`);
					reject(err);
				});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		console.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		let id: string, kind: string;
		this.express.get("/echo/:msg", Server.echo);

		// TODO: your other endpoints should go here
		this.express.put("/dataset/:id/:kind", Server.performPutDataset);
		this.express.delete("/dataset/:id", Server.performDeleteDataset);
		this.express.post("/query", Server.performPostDataset);
		this.express.get("/datasets", Server.performGetDataset);


	}

	/**
	 * The next two methods handle the echo service.
	 * These are almost certainly not the best place to put these, but are here for your reference.
	 * By updating the Server.echo function pointer above, these methods can be easily moved.
	 */
	private static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}

	private static async performPutDataset(req: Request, res: Response) {
		// console.log(`this is the body ${req.body}`);
		// console.log(`the id is ${id}`);
		// console.log(`the kind is ${kind}`);
		// console.log("the body is:");
		// console.log(req.body);
		try {
			if(req === null || req === undefined) {
				throw new InsightError("Request does not exist");
			} else if (Server.insightFacade === null || Server.insightFacade === undefined) {
				throw new InsightError("Insight facade does not exist");
			}
			let id = req?.params.id;
			let kind = req?.params.kind as InsightDatasetKind;
			let base64Content = req?.body.toString("base64");
			let result = await Server.insightFacade?.addDataset(id, base64Content, kind);
			res.status(200).json({result: result});
		} catch (err) {
			res.status(400).json({error: (err as Error).message});
		}
	}

	private static async performDeleteDataset(req: Request, res: Response) {
		try {
			if(req === null || req === undefined) {
				throw new InsightError("Request does not exist");
			} else if (Server.insightFacade === null || Server.insightFacade === undefined) {
				throw new InsightError("Insight facade does not exist");
			}
			let id = req?.params.id;
			let result = await Server.insightFacade?.removeDataset(id);
			res.status(200).json({result: result});
		} catch (err) {
			if (err instanceof NotFoundError) {
				res.status(404).json({error: (err as Error).message});
			} else {
				res.status(400).json({error: (err as Error).message});
			}
		}
	}

	private static async performPostDataset(req: Request, res: Response) {
		try {
			if(req === null || req === undefined) {
				throw new InsightError("Request does not exist");
			} else if (Server.insightFacade === null || Server.insightFacade === undefined) {
				throw new InsightError("Insight facade does not exist");
			}
			let query = req?.body;
			let result = await Server.insightFacade?.performQuery(query);
			res.status(200).json({result: result});
		} catch (err) {
			res.status(400).send({error: (err as Error).message});
		}
	}

	private static async performGetDataset(req: Request, res: Response) {
		try {
			if(req === null || req === undefined) {
				throw new InsightError("Request does not exist");
			} else if (Server.insightFacade === null || Server.insightFacade === undefined) {
				throw new InsightError("Insight facade does not exist");
			}
			let result = await Server.insightFacade?.listDatasets();
			res.status(200).json({result: result});
		} catch (err) {
			res.status(200).json({result: "Insight Facade is null"});
		}
	}
}
