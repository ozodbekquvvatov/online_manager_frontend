import * as React from "react";
import { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { Building2 } from "lucide-react";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred during login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="shadow-lg border-0">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <Building2 size={40} />
                  </div>
                  <h2 className="fw-bold">Business Management</h2>
                  <p className="text-muted">Admin Sign In</p>
                </div>

                {error && (
                  <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setError("")}
                  >
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter admin email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </Form.Group>

                  {/* Demo credentials display */}
                  <div className="mb-3 text-center text-muted">
                    <small>Demo Email: <strong>admin@business.com</strong></small><br />
                    <small>Demo Password: <strong>admin123</strong></small>
                  </div>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 mb-3"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;