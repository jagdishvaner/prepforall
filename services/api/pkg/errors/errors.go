package errors

import (
	"encoding/json"
	"net/http"
)

type AppError struct {
	Code    int    `json:"-"`
	Message string `json:"error"`
	Detail  string `json:"detail,omitempty"`
}

func (e *AppError) Error() string { return e.Message }

var (
	ErrNotFound     = &AppError{Code: http.StatusNotFound, Message: "resource not found"}
	ErrUnauthorized = &AppError{Code: http.StatusUnauthorized, Message: "unauthorized"}
	ErrForbidden    = &AppError{Code: http.StatusForbidden, Message: "forbidden"}
	ErrBadRequest   = &AppError{Code: http.StatusBadRequest, Message: "bad request"}
	ErrInternal     = &AppError{Code: http.StatusInternalServerError, Message: "internal server error"}
	ErrConflict     = &AppError{Code: http.StatusConflict, Message: "resource already exists"}
)

func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func WriteError(w http.ResponseWriter, err *AppError) {
	WriteJSON(w, err.Code, err)
}
