import React, { useState, useEffect,FC  } from "react";

import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Tab,
  Tabs,
  Badge,
  InputGroup,
  Modal,
} from "react-bootstrap";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Lock,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  role: string;
  created_at: string;
  last_login: string;
  is_active: boolean;
}

interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const Profile: FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [editProfile, setEditProfile] = useState<Partial<UserProfile>>({});
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);
  const API_BASE_URL = 'https://onlinemanagerbackend-production.up.railway.app';

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");

      const response = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const result = await response.json();

      if (result.success) {
        setProfile(result.data);
        setEditProfile(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editProfile),
      });

      const result = await response.json();

      if (result.success) {
        setProfile(result.data);
        setMessage({ type: "success", text: "Profile updated successfully!" });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      if (passwordData.new_password !== passwordData.confirm_password) {
        setMessage({ type: "error", text: "New passwords do not match" });
        return;
      }

      if (passwordData.new_password.length < 8) {
        setMessage({
          type: "error",
          text: "Password must be at least 8 characters long",
        });
        return;
      }

      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${API_BASE_URL}/api/admin/change-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
          new_password_confirmation: passwordData.confirm_password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
        setShowPasswordModal(false);
      } else {
        if (result.errors) {
          const errorMessages = Object.values(result.errors).flat().join(", ");
          throw new Error(errorMessages);
        }
        throw new Error(result.message || "Failed to change password");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to change password",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${API_BASE_URL}/api/admin/profile/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setProfile(result.data);
        setEditProfile(result.data);
        setMessage({
          type: "success",
          text: "Profile picture updated successfully!",
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update profile picture" });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading profile...</p>
        </div>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container className="py-4">
        <Alert variant="danger" className="my-4">
          Failed to load profile. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-3 px-3">
      {/* Header - Mobile Optimized */}
      <div className="text-center mb-4">
        <h1 className="h3 fw-bold mb-2">Profile Settings</h1>
        <p className="text-muted small">Manage your account settings</p>
      </div>

      {message && (
        <Alert
          variant={message.type === "success" ? "success" : "danger"}
          className="mb-3"
        >
          <div className="d-flex align-items-center">
            {message.type === "success" ? (
              <CheckCircle size={18} className="me-2" />
            ) : (
              <XCircle size={18} className="me-2" />
            )}
            <span className="small">{message.text}</span>
          </div>
        </Alert>
      )}

      {/* Tabs - Mobile Optimized */}
      <Tabs
        activeKey={activeTab}
        onSelect={(tab) => setActiveTab(tab || "profile")}
        className="mb-3"
        justify
        fill
      >
        {/* Profile Information Tab */}
        <Tab
          eventKey="profile"
          title={
            <span className="d-flex align-items-center justify-content-center">
              <User size={16} className="me-1" />
              <span className="d-none d-sm-inline">Profile</span>
            </span>
          }
        >
          <Row className="g-3">
            {/* Profile Card - Full width on mobile */}
            <Col xs={12} lg={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-3">
                  <div className="position-relative d-inline-block mb-3">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt="Profile"
                        className="rounded-circle"
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white mx-auto"
                        style={{
                          width: "100px",
                          height: "100px",
                          fontSize: "1.5rem",
                        }}
                      >
                        {getInitials(profile.name)}
                      </div>
                    )}
                    <label
                      htmlFor="avatar-upload"
                      className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2"
                      style={{
                        cursor: "pointer",
                        width: "32px",
                        height: "32px",
                      }}
                    >
                      <Camera size={14} />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>

                  <h5 className="mb-1">{profile.name}</h5>
                  <p className="text-muted small mb-2">{profile.email}</p>

                  <Badge
                    bg={profile.is_active ? "success" : "secondary"}
                    className="mb-3"
                  >
                    {profile.is_active ? "Active" : "Inactive"}
                  </Badge>

                  <div className="text-start small mt-3">
                    <div className="d-flex align-items-center mb-2">
                      <Shield size={14} className="text-muted me-2" />
                      <span className="text-muted">Role: {profile.role}</span>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <CheckCircle size={14} className="text-muted me-2" />
                      <span className="text-muted">
                        Joined:{" "}
                        {new Date(profile.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {profile.last_login && (
                      <div className="d-flex align-items-center">
                        <CheckCircle size={14} className="text-muted me-2" />
                        <span className="text-muted">
                          Last login:{" "}
                          {new Date(profile.last_login).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Edit Form - Full width on mobile */}
            <Col xs={12} lg={8}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-3">
                  <h6 className="card-title mb-3">Personal Information</h6>

                  <Form onSubmit={handleProfileUpdate}>
                    <Row className="g-2">
                      <Col xs={12}>
                        <Form.Group className="mb-2">
                          <Form.Label className="small fw-semibold">
                            Full Name
                          </Form.Label>
                          <InputGroup size="sm">
                            <InputGroup.Text className="bg-light">
                              <User size={14} />
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              value={editProfile.name || ""}
                              onChange={(e) =>
                                setEditProfile({
                                  ...editProfile,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Enter your full name"
                              required
                              size="sm"
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>

                      <Col xs={12}>
                        <Form.Group className="mb-2">
                          <Form.Label className="small fw-semibold">
                            Email Address
                          </Form.Label>
                          <InputGroup size="sm">
                            <InputGroup.Text className="bg-light">
                              <Mail size={14} />
                            </InputGroup.Text>
                            <Form.Control
                              type="email"
                              value={editProfile.email || ""}
                              onChange={(e) =>
                                setEditProfile({
                                  ...editProfile,
                                  email: e.target.value,
                                })
                              }
                              placeholder="Enter your email"
                              required
                              size="sm"
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>

                      <Col xs={12}>
                        <Form.Group className="mb-2">
                          <Form.Label className="small fw-semibold">
                            Phone Number
                          </Form.Label>
                          <InputGroup size="sm">
                            <InputGroup.Text className="bg-light">
                              <Phone size={14} />
                            </InputGroup.Text>
                            <Form.Control
                              type="tel"
                              value={editProfile.phone || ""}
                              onChange={(e) =>
                                setEditProfile({
                                  ...editProfile,
                                  phone: e.target.value,
                                })
                              }
                              placeholder="Enter your phone number"
                              size="sm"
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>

                      <Col xs={12}>
                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-semibold">
                            Address
                          </Form.Label>
                          <InputGroup size="sm">
                            <InputGroup.Text className="bg-light">
                              <MapPin size={14} />
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              value={editProfile.address || ""}
                              onChange={(e) =>
                                setEditProfile({
                                  ...editProfile,
                                  address: e.target.value,
                                })
                              }
                              placeholder="Enter your address"
                              size="sm"
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mt-3">
                      <Button
                        variant="outline-primary"
                        onClick={() => setShowPasswordModal(true)}
                        type="button"
                        size="sm"
                        className="flex-fill"
                      >
                        <Lock size={14} className="me-1" />
                        Change Password
                      </Button>

                      <Button
                        variant="primary"
                        type="submit"
                        disabled={saving}
                        size="sm"
                        className="flex-fill"
                      >
                        {saving ? (
                          <>
                            <div
                              className="spinner-border spinner-border-sm me-1"
                              role="status"
                            >
                              <span className="visually-hidden">Saving...</span>
                            </div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={14} className="me-1" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* Security Tab - Mobile Optimized */}
        <Tab
          eventKey="security"
          title={
            <span className="d-flex align-items-center justify-content-center">
              <Shield size={16} className="me-1" />
              <span className="d-none d-sm-inline">Security</span>
            </span>
          }
        >
          <Row className="g-3">
            <Col xs={12} lg={8}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-3">
                  <h6 className="card-title mb-3">Security Settings</h6>

                  <div className="mb-3">
                    <h6 className="small fw-semibold">Password</h6>
                    <p className="text-muted small mb-2">
                      Change your password to keep your account secure.
                    </p>
                    <Button
                      variant="outline-primary"
                      onClick={() => setShowPasswordModal(true)}
                      size="sm"
                    >
                      <Lock size={14} className="me-1" />
                      Change Password
                    </Button>
                  </div>

                  <div className="mb-3">
                    <h6 className="small fw-semibold">
                      Two-Factor Authentication
                    </h6>
                    <p className="text-muted small mb-2">
                      Add an extra layer of security to your account.
                    </p>
                    <Badge bg="secondary" className="small">
                      Not Enabled
                    </Badge>
                  </div>

                  <div>
                    <h6 className="small fw-semibold">Login Activity</h6>
                    <p className="text-muted small">
                      Last login:{" "}
                      {profile.last_login
                        ? new Date(profile.last_login).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} lg={4}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-3">
                  <h6 className="card-title mb-3">Security Tips</h6>
                  <ul className="list-unstyled text-muted small mb-0">
                    <li className="mb-2">• Use a strong, unique password</li>
                    <li className="mb-2">• Enable two-factor authentication</li>
                    <li className="mb-2">• Keep contact info updated</li>
                    <li className="mb-2">• Be cautious of suspicious emails</li>
                    <li>• Log out from shared devices</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>

      {/* Change Password Modal - Mobile Optimized */}
      <Modal
        show={showPasswordModal}
        onHide={() => setShowPasswordModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="px-3 py-2">
          <Modal.Title className="h6 mb-0">
            <Lock size={18} className="me-2" />
            Change Password
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePasswordChange}>
          <Modal.Body className="p-3">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">
                Current Password
              </Form.Label>
              <InputGroup size="sm">
                <Form.Control
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.current_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      current_password: e.target.value,
                    })
                  }
                  placeholder="Enter current password"
                  required
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  size="sm"
                >
                  {showCurrentPassword ? (
                    <EyeOff size={14} />
                  ) : (
                    <Eye size={14} />
                  )}
                </Button>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">
                New Password
              </Form.Label>
              <InputGroup size="sm">
                <Form.Control
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.new_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      new_password: e.target.value,
                    })
                  }
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  size="sm"
                >
                  {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </Button>
              </InputGroup>
              <Form.Text className="text-muted small">
                Password must be at least 8 characters long.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">
                Confirm New Password
              </Form.Label>
              <InputGroup size="sm">
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirm_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirm_password: e.target.value,
                    })
                  }
                  placeholder="Confirm new password"
                  required
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  size="sm"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={14} />
                  ) : (
                    <Eye size={14} />
                  )}
                </Button>
              </InputGroup>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="px-3 py-2">
            <Button
              variant="outline-secondary"
              onClick={() => setShowPasswordModal(false)}
              size="sm"
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving} size="sm">
              {saving ? "Changing..." : "Change Password"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style>{`
        @media (max-width: 576px) {
          .container {
            padding-left: 12px;
            padding-right: 12px;
          }
          
          .nav-tabs .nav-link {
            padding: 8px 12px;
            font-size: 0.875rem;
          }
          
          .card {
            margin-bottom: 1rem;
          }
          
          .btn {
            font-size: 0.875rem;
          }
        }
        
        .profile-card {
          transition: transform 0.2s ease;
        }
        
        .profile-card:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </Container>
  );
};
export default Profile;
