/* import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import server from "../app.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

chai.use(chaiHttp);

describe("Auth Controller", () => {
  let mongoServer;

  before("Connect Database", async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = await mongoServer.getUri();
    await mongoose.connect(
      mongoUri,
      {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
      },
      (err) => {
        if (err) console.error(err);
      }
    );
  });

  after("Discount and stop mongo server", async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it("should create an account", (done) => {
    chai
      .request(server)
      .post("/auth/signup")
      .send({
        name: "taib haroub",
        password: "1234567",
        phoneNumber: "123456789012",
        email: "test@test.com",
      })
      .then((res) => {
        // expect(res.body).to.have.property("userId");
        expect(res.status).to.equal(201);
        expect(res.body).to.have.property("userId");
        expect(res.body).to.be.a("object");
        done();
      });
  });

  it("should return a user with this account could not be found and a 401", (done) => {
    chai
      .request(server)
      .post("/auth/login")
      .send({ email: "taibu@taibu.com", password: "123456" })
      .then((res) => {
        expect(res.status).to.equal(401);
        done();
      });
  });

  //end
});
 */
