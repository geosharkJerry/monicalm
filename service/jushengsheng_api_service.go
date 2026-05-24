package service

import "errors"

type jushengshengAPI interface {
	PushAssetToPlatform(submissionID int) (string, error)
}

var JushengshengApiService jushengshengAPI = &noopJushengshengAPI{}

type noopJushengshengAPI struct{}

func (n *noopJushengshengAPI) PushAssetToPlatform(submissionID int) (string, error) {
	return "", errors.New("jushengsheng api service not configured")
}

