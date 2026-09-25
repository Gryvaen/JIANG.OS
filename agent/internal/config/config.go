// Package config loads the agent's local config.yaml.
package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type ServiceCheck struct {
	Name   string `yaml:"name"`
	Type   string `yaml:"type"`
	Target string `yaml:"target"`
}

type Config struct {
	ServerURL                string         `yaml:"server_url"`
	TokenID                  string         `yaml:"token_id"`
	Token                    string         `yaml:"token"`
	HeartbeatIntervalSeconds int            `yaml:"heartbeat_interval_seconds"`
	ServiceChecks            []ServiceCheck `yaml:"service_checks"`
}

func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("reading config file: %w", err)
	}
	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parsing config file: %w", err)
	}
	if cfg.ServerURL == "" {
		return nil, fmt.Errorf("config: server_url is required")
	}
	if cfg.TokenID == "" || cfg.Token == "" {
		return nil, fmt.Errorf("config: token_id and token are required")
	}
	if cfg.HeartbeatIntervalSeconds <= 0 {
		cfg.HeartbeatIntervalSeconds = 30
	}
	return &cfg, nil
}
