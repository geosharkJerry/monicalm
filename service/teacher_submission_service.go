package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/QuantumNous/new-api/model"
	"gorm.io/gorm"
)

const (
	SubmissionStatusGraded              = "GRADED"
	SubmissionStatusPushedToJushengsheng = "PUSHED_TO_JUSHENGSHENG"
)

type ApproveSubmissionResult struct {
	SubmissionID        int    `json:"submissionId"`
	Status              string `json:"status"`
	PushTaskDispatched  bool   `json:"pushTaskDispatched"`
}

func ApproveSubmission(teacherID int, submissionID int, finalScore float64, teacherComment string, pushToJushengsheng bool) (*ApproveSubmissionResult, error) {
	var submission model.Submission
	err := model.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&submission, submissionID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return fmt.Errorf("submission not found: %w", err)
			}
			return err
		}
		var classRef model.PracticumClass
		if err := tx.First(&classRef, submission.PracticumClassID).Error; err != nil {
			return err
		}
		if classRef.TeacherID != teacherID {
			return errors.New("该实训班级不属于当前教师")
		}

		updates := map[string]interface{}{
			"final_score":     finalScore,
			"teacher_comment": teacherComment,
			"status":          SubmissionStatusGraded,
			"updated_at":      time.Now(),
		}
		return tx.Model(&submission).Updates(updates).Error
	})
	if err != nil {
		return nil, err
	}

	if pushToJushengsheng {
		go pushSubmissionToJushengsheng(submissionID)
	}

	return &ApproveSubmissionResult{SubmissionID: submissionID, Status: SubmissionStatusGraded, PushTaskDispatched: pushToJushengsheng}, nil
}

func pushSubmissionToJushengsheng(submissionID int) {
	dramaID, err := JushengshengApiService.PushAssetToPlatform(submissionID)
	if err != nil {
		return
	}
	_ = model.DB.Transaction(func(tx *gorm.DB) error {
		ref := model.JushengshengRef{SubmissionID: submissionID, DramaID: dramaID}
		if err := tx.Create(&ref).Error; err != nil {
			return err
		}
		return tx.Model(&model.Submission{}).Where("id = ?", submissionID).Updates(map[string]interface{}{
			"status":     SubmissionStatusPushedToJushengsheng,
			"updated_at": time.Now(),
		}).Error
	})
}

