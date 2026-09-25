// Command jiang-os-agent reports CPU/memory/disk/load/uptime and configured
// local service checks to a JIANG.OS server on a fixed interval.
package main

import (
	"flag"
	"log"
	"time"

	"github.com/jiang/jiang-os-agent/internal/client"
	"github.com/jiang/jiang-os-agent/internal/collect"
	"github.com/jiang/jiang-os-agent/internal/config"
	gopsprocess "github.com/shirou/gopsutil/v3/process"
)

func main() {
	configPath := flag.String("config", "config.yaml", "path to config.yaml")
	flag.Parse()

	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Fatalf("loading config: %v", err)
	}
	c := client.New(cfg.ServerURL, cfg.TokenID, cfg.Token)
	interval := time.Duration(cfg.HeartbeatIntervalSeconds) * time.Second
	log.Printf("jiang-os-agent starting, heartbeat every %s", interval)

	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	runOnce(c, cfg)
	for range ticker.C {
		runOnce(c, cfg)
	}
}

func runOnce(c *client.Client, cfg *config.Config) {
	snap, err := collect.Collect()
	if err != nil {
		log.Printf("collect error: %v", err)
		return
	}
	if err := c.Heartbeat(snap); err != nil {
		log.Printf("heartbeat error: %v", err)
	}
	if len(cfg.ServiceChecks) == 0 {
		return
	}
	results := make([]client.ServiceCheckResult, 0, len(cfg.ServiceChecks))
	for _, check := range cfg.ServiceChecks {
		results = append(results, client.ServiceCheckResult{Name: check.Name, Type: check.Type, Target: check.Target, OK: probeCheck(check)})
	}
	if err := c.Services(results); err != nil {
		log.Printf("services error: %v", err)
	}
}

func probeCheck(check config.ServiceCheck) bool {
	if check.Type != "process" {
		return false
	}
	procs, err := gopsprocess.Processes()
	if err != nil {
		return false
	}
	for _, p := range procs {
		if name, err := p.Name(); err == nil && name == check.Target {
			return true
		}
	}
	return false
}
