package controller

import (
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
)

type ApproveSubmissionRequest struct {
	FinalScore          float64 `json:"finalScore" binding:"required"`
	TeacherComment      string  `json:"teacherComment"`
	PushToJushengsheng  bool    `json:"pushToJushengsheng"`
}

func ApproveSubmission(c *gin.Context) {
	callerRole := c.GetString("role_name")
	if callerRole == "" {
		if c.GetInt("role") < common.RoleAdminUser {
			common.ApiErrorMsg(c, "仅教师可审批作业")
			return
		}
	} else if callerRole != "TEACHER" {
		common.ApiErrorMsg(c, "仅教师可审批作业")
		return
	}

	teacherID := c.GetInt("id")
	if teacherID <= 0 {
		common.ApiErrorMsg(c, "无效的教师身份")
		return
	}

	submissionID, err := strconv.Atoi(c.Param("id"))
	if err != nil || submissionID <= 0 {
		common.ApiErrorMsg(c, "无效的提交ID")
		return
	}

	var req ApproveSubmissionRequest
	if err = c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}

	result, err := service.ApproveSubmission(teacherID, submissionID, req.FinalScore, req.TeacherComment, req.PushToJushengsheng)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    result,
	})
}

