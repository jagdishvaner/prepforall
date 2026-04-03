package auth

import (
	"context"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/prepforall/api/pkg/errors"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repo      *Repository
	rdb       *redis.Client
	jwtSecret string
	jwtExpiry string
	log       *zap.Logger
}

func NewService(repo *Repository, rdb *redis.Client, secret, expiry string, log *zap.Logger) *Service {
	return &Service{repo: repo, rdb: rdb, jwtSecret: secret, jwtExpiry: expiry, log: log}
}

func (s *Service) Register(ctx context.Context, req RegisterRequest) (*AuthResponse, *errors.AppError) {
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.ErrInternal
	}

	user, err := s.repo.CreateUser(ctx, req.Username, req.Email, string(hash))
	if err != nil {
		return nil, errors.ErrConflict
	}

	return s.generateTokens(user.ID, user.Username, user.Role)
}

func (s *Service) Login(ctx context.Context, req LoginRequest) (*AuthResponse, *errors.AppError) {
	user, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.ErrUnauthorized
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.ErrUnauthorized
	}

	return s.generateTokens(user.ID, user.Username, user.Role)
}

func (s *Service) generateTokens(userID, username, role string) (*AuthResponse, *errors.AppError) {
	expiry, _ := time.ParseDuration(s.jwtExpiry)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      userID,
		"username": username,
		"role":     role,
		"exp":      time.Now().Add(expiry).Unix(),
		"iat":      time.Now().Unix(),
	})

	signed, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return nil, errors.ErrInternal
	}

	return &AuthResponse{
		AccessToken: signed,
		ExpiresIn:   int(expiry.Seconds()),
	}, nil
}
