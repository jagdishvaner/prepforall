package users

import "time"

type User struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email,omitempty"`
	Role      string    `json:"role"`
	Rating    int       `json:"rating"`
	AvatarURL string    `json:"avatar_url,omitempty"`
	Bio       string    `json:"bio,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type UserStats struct {
	TotalSolved    int `json:"total_solved"`
	EasySolved     int `json:"easy_solved"`
	MediumSolved   int `json:"medium_solved"`
	HardSolved     int `json:"hard_solved"`
	TotalSubmissions int `json:"total_submissions"`
	AcceptanceRate float64 `json:"acceptance_rate"`
}
