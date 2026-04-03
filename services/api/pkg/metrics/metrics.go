package metrics

import "github.com/prometheus/client_golang/prometheus"

var (
	HTTPRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request latency distribution",
			Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5},
		},
		[]string{"method", "route", "status"},
	)

	HTTPRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "route", "status"},
	)

	ActiveWebSockets = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "active_websocket_connections",
			Help: "Number of active WebSocket connections",
		},
	)

	SubmissionQueueDepth = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "submission_queue_depth",
			Help: "Number of pending submissions in queue",
		},
	)

	VerdictTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "verdict_total",
			Help: "Total submissions by verdict",
		},
		[]string{"verdict", "language"},
	)
)

func RegisterAll() {
	prometheus.MustRegister(
		HTTPRequestDuration,
		HTTPRequestsTotal,
		ActiveWebSockets,
		SubmissionQueueDepth,
		VerdictTotal,
	)
}
