import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Form,
  Button,
  ListGroup,
  Alert,
  Spinner,
  Collapse,
  Row,
  Col,
} from "react-bootstrap";

const baseUrl = "http://localhost:3000/api/messages"; // sesuaikan dengan API-mu

function MessagePage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [expandedMessageId, setExpandedMessageId] = useState(null);
  const [replies, setReplies] = useState({});
  const [loadingRepliesId, setLoadingRepliesId] = useState(null);

  const [replyInputs, setReplyInputs] = useState({});

  // Fetch pesan utama saat komponen mount
  useEffect(() => {
    fetchMessages();
  }, []);

  // Fungsi ambil pesan utama
  const fetchMessages = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(baseUrl);
      if (res.data.status) {
        setMessages(res.data.data);
      } else {
        setError("Gagal memuat pesan.");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat memuat pesan.", err);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi ambil balasan untuk pesan tertentu
  const fetchReplies = async (msgId) => {
    setLoadingRepliesId(msgId);
    try {
      const res = await axios.get(`${baseUrl}/${msgId}/reply`);
      if (res.data.status) {
        setReplies((prev) => ({ ...prev, [msgId]: res.data.data }));
      } else {
        setReplies((prev) => ({ ...prev, [msgId]: [] }));
      }
    } catch {
      setReplies((prev) => ({ ...prev, [msgId]: [] }));
    } finally {
      setLoadingRepliesId(null);
    }
  };

  // Toggle tampilkan balasan pesan
  const toggleReply = async (msgId) => {
    if (expandedMessageId === msgId) {
      setExpandedMessageId(null);
      return;
    }

    setExpandedMessageId(msgId);

    if (!replies[msgId]) {
      await fetchReplies(msgId);
    }
  };

  // Kirim pesan utama baru
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Pesan tidak boleh kosong.");
      return;
    }

    setSending(true);
    setError("");
    try {
      const res = await axios.post(baseUrl, { message: message.trim() });
      if (res.data.status) {
        setMessage("");
        fetchMessages();
      } else {
        setError(res.data.message || "Gagal mengirim pesan.");
      }
    } catch {
      setError("Terjadi kesalahan saat mengirim pesan.");
    } finally {
      setSending(false);
    }
  };

  // Kirim balasan pesan
  const handleReplySubmit = async (e, msgId) => {
    e.preventDefault();
    const replyText = (replyInputs[msgId] || "").trim();
    if (!replyText) {
      alert("Balasan tidak boleh kosong.");
      return;
    }

    setSending(true);
    try {
      const res = await axios.post(`${baseUrl}/${msgId}/reply`, { message: replyText });
      if (res.data.status) {
        // Clear input balasan
        setReplyInputs((prev) => ({ ...prev, [msgId]: "" }));

        // Reload balasan terbaru
        await fetchReplies(msgId);

        // Pastikan dropdown tetap terbuka
        setExpandedMessageId(msgId);
      } else {
        alert(res.data.message || "Gagal mengirim balasan.");
      }
    } catch {
      alert("Terjadi kesalahan saat mengirim balasan.");
    } finally {
      setSending(false);
    }
  };

  // Hapus pesan utama
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Yakin ingin menghapus pesan ini?")) return;

    try {
      const res = await axios.delete(`${baseUrl}/${msgId}`);
      if (res.data.status) {
        setMessages((prev) => prev.filter((msg) => msg.id !== msgId));
        if (expandedMessageId === msgId) setExpandedMessageId(null);
      } else {
        alert(res.data.message || "Gagal menghapus pesan.");
      }
    } catch {
      alert("Terjadi kesalahan saat menghapus pesan.");
    }
  };

  // Hapus balasan pesan
  const handleDeleteReply = async (msgId, replyId) => {
    if (!window.confirm("Yakin ingin menghapus balasan ini?")) return;

    try {
      const res = await axios.delete(`${baseUrl}/${msgId}/reply/${replyId}`);
      if (res.data.status) {
        setReplies((prev) => ({
          ...prev,
          [msgId]: prev[msgId].filter((r) => r.id !== replyId),
        }));
      } else {
        alert(res.data.message || "Gagal menghapus balasan.");
      }
    } catch {
      alert("Terjadi kesalahan saat menghapus balasan.");
    }
  };

  return (
    <Container className="mt-4" style={{ maxWidth: 600 }}>
      <h2>Pesan</h2>

      <Form onSubmit={handleSubmit} className="mb-4">
        <Form.Group controlId="formMessage" className="mb-3">
          <Form.Label>Pesan Baru</Form.Label>
          <Form.Control
            type="text"
            placeholder="Tulis pesan..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </Form.Group>

        {error && <Alert variant="danger">{error}</Alert>}

        <Button type="submit" disabled={sending}>
          {sending ? "Mengirim..." : "Kirim"}
        </Button>
      </Form>

      <h4>Daftar Pesan</h4>

      {loading ? (
        <div className="text-center my-3">
          <Spinner animation="border" />
        </div>
      ) : messages.length === 0 ? (
        <p>Belum ada pesan.</p>
      ) : (
        <ListGroup>
          {messages.map((msg) => (
            <ListGroup.Item key={msg.id}>
              <Row>
                <Col xs={8}>
                  <strong>{msg.message}</strong>
                  <br />
                  <small className="text-muted">{msg.created_at}</small>
                </Col>
                <Col xs={4} className="text-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="me-2"
                    onClick={() => toggleReply(msg.id)}
                  >
                    {expandedMessageId === msg.id ? "Tutup Reply" : "Lihat Reply"}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteMessage(msg.id)}
                  >
                    Hapus
                  </Button>
                </Col>
              </Row>

              <Collapse in={expandedMessageId === msg.id}>
                <div className="mt-3">
                  {loadingRepliesId === msg.id && <Spinner animation="border" size="sm" />}

                  {!loadingRepliesId &&
                    (!replies[msg.id] || replies[msg.id].length === 0) && (
                      <p className="text-muted">Belum ada balasan.</p>
                    )}

                  {!loadingRepliesId && replies[msg.id] && replies[msg.id].length > 0 && (
                    <ListGroup variant="flush" className="mb-3">
                      {replies[msg.id].map((reply) => (
                        <ListGroup.Item
                          key={reply.id}
                          className="d-flex justify-content-between align-items-center ms-3"
                        >
                          <div>
                            <strong>{reply.message}</strong>
                            <br />
                            <small className="text-muted">{reply.created_at}</small>
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteReply(msg.id, reply.id)}
                          >
                            Hapus
                          </Button>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}

                  {/* Form balasan */}
                  <Form onSubmit={(e) => handleReplySubmit(e, msg.id)}>
                    <Form.Group controlId={`formReply-${msg.id}`} className="mb-2">
                      <Form.Control
                        type="text"
                        placeholder="Tulis balasan..."
                        value={replyInputs[msg.id] || ""}
                        onChange={(e) =>
                          setReplyInputs((prev) => ({
                            ...prev,
                            [msg.id]: e.target.value,
                          }))
                        }
                      />
                    </Form.Group>
                    <Button size="sm" type="submit" disabled={sending}>
                      {sending ? "Mengirim..." : "Kirim Balasan"}
                    </Button>
                  </Form>
                </div>
              </Collapse>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </Container>
  );
}

export default MessagePage;