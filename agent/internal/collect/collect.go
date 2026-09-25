// Package collect gathers local CPU/memory/disk/load/uptime metrics.
package collect

import (
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/load"
	"github.com/shirou/gopsutil/v3/mem"
)

type Snapshot struct {
	CPUPercent    float64 `json:"cpuPercent"`
	MemoryPercent float64 `json:"memoryPercent"`
	DiskPercent   float64 `json:"diskPercent"`
	LoadAvg1      float64 `json:"loadAvg1"`
	UptimeSeconds float64 `json:"uptimeSeconds"`
}

func Collect() (Snapshot, error) {
	var snap Snapshot
	cpuPercents, err := cpu.Percent(0, false)
	if err != nil {
		return snap, err
	}
	if len(cpuPercents) > 0 {
		snap.CPUPercent = cpuPercents[0]
	}
	vm, err := mem.VirtualMemory()
	if err != nil {
		return snap, err
	}
	snap.MemoryPercent = vm.UsedPercent
	du, err := disk.Usage("/")
	if err != nil {
		return snap, err
	}
	snap.DiskPercent = du.UsedPercent
	avg, err := load.Avg()
	if err == nil && avg != nil {
		snap.LoadAvg1 = avg.Load1
	}
	uptime, err := host.Uptime()
	if err == nil {
		snap.UptimeSeconds = float64(uptime)
	}
	return snap, nil
}
