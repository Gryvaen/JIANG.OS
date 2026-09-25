// Package client sends signed heartbeat/metrics/service-check requests to
// the JIANG.OS server, using the HMAC scheme implemented in sign.go.
package client

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/jiang/jiang-os-agent/internal/collect"
)

type Client struct {
	BaseURL    string
	TokenID    string
	TokenHash  string
	HTTPClient *http.Client
}

func New(baseURL, tokenID, rawToken string) *Client {
	return &Client{
		BaseURL:    strings.TrimRight(baseURL, "/"),
		TokenID:    tokenID,
		TokenHash:  DeriveTokenHash(rawToken),
		HTTPClient: &http.Client{Timeout: 10 * time.Second},
	}
}

type MetricSample struct {
	RecordedAt    string  `json:"recordedAt"`
	CPUPercent    float64 `json:"cpuPercent"`
	MemoryPercent float64 `json:"memoryPercent"`
	DiskPercent   float64 `json:"diskPercent"`
	LoadAvg1      float64 `json:"loadAvg1"`
}

type ServiceCheckResult struct {
	Name   string `json:"name"`
	Type   string `json:"type"`
	Target string `json:"target"`
	OK     bool   `json:"ok"`
}

func (c *Client) Heartbeat(snap collect.Snapshot) error {
	return c.post("heartbeat", snap)
}
func (c *Client) MetricsBatch(samples []MetricSample) error {
	return c.post("metrics", map[string]any{"samples": samples})
}
func (c *Client) Services(checks []ServiceCheckResult) error {
	return c.post("services", map[string]any{"checks": checks})
}

func randomNonce() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func (c *Client) post(name string, payload any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("encoding request body: %w", err)
	}
	fullURL := c.BaseURL + "/" + name
	parsed, err := url.Parse(fullURL)
	if err != nil {
		return fmt.Errorf("parsing endpoint url: %w", err)
	}
	nonce, err := randomNonce()
	if err != nil {
		return fmt.Errorf("generating nonce: %w", err)
	}
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	signature := Sign(c.TokenHash, http.MethodPost, parsed.Path, timestamp, nonce, string(body))
	req, err := http.NewRequest(http.MethodPost, fullURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("building request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Agent-Token-Id", c.TokenID)
	req.Header.Set("X-Agent-Timestamp", timestamp)
	req.Header.Set("X-Agent-Nonce", nonce)
	req.Header.Set("X-Agent-Signature", signature)
	res, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("sending request to %s: %w", name, err)
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		respBody, _ := io.ReadAll(res.Body)
		return fmt.Errorf("request to %s failed: %s: %s", name, res.Status, string(respBody))
	}
	return nil
}
