package model

import "time"

type Submission struct {
	ID              int       `gorm:"primaryKey;column:id" json:"id"`
	PracticumClassID int      `gorm:"column:practicum_class_id;not null" json:"practicumClassId"`
	FinalScore      float64   `gorm:"column:final_score" json:"finalScore"`
	TeacherComment  string    `gorm:"column:teacher_comment" json:"teacherComment"`
	Status          string    `gorm:"column:status;type:varchar(64);not null" json:"status"`
	UpdatedAt       time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

func (Submission) TableName() string {
	return "submissions"
}

type PracticumClass struct {
	ID        int `gorm:"primaryKey;column:id"`
	TeacherID int `gorm:"column:teacher_id;not null"`
}

func (PracticumClass) TableName() string {
	return "practicum_classes"
}

type JushengshengRef struct {
	ID           int       `gorm:"primaryKey;column:id"`
	SubmissionID int       `gorm:"column:submission_id;not null;index"`
	DramaID      string    `gorm:"column:drama_id;type:varchar(255);not null"`
	CreatedAt    time.Time `gorm:"column:created_at"`
	UpdatedAt    time.Time `gorm:"column:updated_at"`
}

func (JushengshengRef) TableName() string {
	return "jushengsheng_refs"
}

