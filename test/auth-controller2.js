/* import chai, { should } from "chai";
import chaiHttp from "chai-http";
//we import sever since we are using the local db
//also u have to export sever object from from server.js file
import server from "../server.js";

chai.should();
chai.use(chaiHttp);

describe("Auth Controller", () => {
  it("it should create a user", (done) => {
    chai
      .request(server)
      .post("/auth/signup")
      .send({
        email: "lo@lo.com",
        name: "lo lo",
        password: "12345678",
        phoneNumber: "129496479710",
      })
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.have.property("message").eql("User created!");
        done();
      });
  });

  it("should login in a user", (done) => {
    const body = {
      email: "taibu@taibu.com",
      password: "123456",
    };
    chai
      .request(server)
      .post("/auth/login")
      .send(body)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("userId");
        res.body.should.have.property("token");
        done();
      });
  });

  it("should return a 307 staus if user is suspended", (done) => {
    const body = {
      email: "robin@robin.com",
      password: "123456",
    };
    chai
      .request(server)
      .post("/auth/login")
      .send(body)
      .end((err, res) => {
        res.should.have.status(307);
        done();
      });
  });
});
 */
