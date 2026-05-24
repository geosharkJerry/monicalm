package model

import (
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
)

type AgentCostUnit struct {
	InputPricePer1K  float64 `json:"input_price_per_1k"`
	OutputPricePer1K float64 `json:"output_price_per_1k"`
}

type AgentCostStat struct {
	AgentType        string  `json:"agent_type"`
	PromptTokens     int64   `json:"prompt_tokens"`
	CompletionTokens int64   `json:"completion_tokens"`
	TotalTokens      int64   `json:"total_tokens"`
	InputPricePer1K  float64 `json:"input_price_per_1k"`
	OutputPricePer1K float64 `json:"output_price_per_1k"`
	EstimatedCost    float64 `json:"estimated_cost"`
}

type GroupActiveUser struct {
	School      string `json:"school"`
	Class       string `json:"class"`
	ActiveUsers int64  `json:"active_users"`
}

type DashboardAnalytics struct {
	TotalRevenuePaid float64           `json:"total_revenue_paid"`
	ActiveByOrg      []GroupActiveUser `json:"active_by_org"`
	MonthlyAgentCost []AgentCostStat   `json:"monthly_agent_cost"`
	MonthlyCostTotal float64           `json:"monthly_cost_total"`
	ROI              float64           `json:"roi"`
}

func GetAdminDashboardAnalytics(priceMap map[string]AgentCostUnit) (*DashboardAnalytics, error) {
	result := &DashboardAnalytics{ActiveByOrg: make([]GroupActiveUser, 0), MonthlyAgentCost: make([]AgentCostStat, 0)}

	if err := DB.Model(&TopUp{}).Where("status = ?", "success").Select("COALESCE(SUM(money),0)").Scan(&result.TotalRevenuePaid).Error; err != nil {
		return nil, err
	}

	cutoff := time.Now().AddDate(0, 0, -30).Unix()
	type groupRow struct {
		Group       string `gorm:"column:group"`
		ActiveUsers int64  `gorm:"column:active_users"`
	}
	var groupRows []groupRow
	if err := LOG_DB.Table("logs l").
		Select("u.group as \"group\", COUNT(DISTINCT l.user_id) as active_users").
		Joins("JOIN users u ON u.id = l.user_id").
		Where("l.type = ? AND l.created_at >= ?", LogTypeConsume, cutoff).
		Group("u.group").
		Scan(&groupRows).Error; err != nil {
		return nil, err
	}
	for _, row := range groupRows {
		school := row.Group
		class := "default"
		if strings.Contains(row.Group, "/") {
			parts := strings.SplitN(row.Group, "/", 2)
			school = strings.TrimSpace(parts[0])
			class = strings.TrimSpace(parts[1])
		}
		result.ActiveByOrg = append(result.ActiveByOrg, GroupActiveUser{School: school, Class: class, ActiveUsers: row.ActiveUsers})
	}

	startOfMonth := time.Now().UTC()
	startOfMonthTs := time.Date(startOfMonth.Year(), startOfMonth.Month(), 1, 0, 0, 0, 0, time.UTC).Unix()
	allowedTypes := []string{"DRAMA", "MUSIC", "AD", "GAME"}

	type costRow struct {
		AgentType        string `gorm:"column:agent_type"`
		PromptTokens     int64  `gorm:"column:prompt_tokens"`
		CompletionTokens int64  `gorm:"column:completion_tokens"`
	}
	var costRows []costRow
	if err := LOG_DB.Table("logs l").
		Select("l.model_name as agent_type, COALESCE(SUM(l.prompt_tokens),0) as prompt_tokens, COALESCE(SUM(l.completion_tokens),0) as completion_tokens").
		Joins("JOIN users u ON u.id = l.user_id").
		Where("l.type = ? AND l.created_at >= ? AND u.role = ? AND l.model_name IN ?", LogTypeConsume, startOfMonthTs, common.RoleCommonUser, allowedTypes).
		Group("l.model_name").
		Scan(&costRows).Error; err != nil {
		return nil, err
	}

	for _, t := range allowedTypes {
		result.MonthlyAgentCost = append(result.MonthlyAgentCost, AgentCostStat{AgentType: t, InputPricePer1K: priceMap[t].InputPricePer1K, OutputPricePer1K: priceMap[t].OutputPricePer1K})
	}
	for _, row := range costRows {
		for i := range result.MonthlyAgentCost {
			if result.MonthlyAgentCost[i].AgentType != row.AgentType {
				continue
			}
			stat := &result.MonthlyAgentCost[i]
			stat.PromptTokens = row.PromptTokens
			stat.CompletionTokens = row.CompletionTokens
			stat.TotalTokens = row.PromptTokens + row.CompletionTokens
			stat.EstimatedCost = (float64(stat.PromptTokens)/1000.0)*stat.InputPricePer1K + (float64(stat.CompletionTokens)/1000.0)*stat.OutputPricePer1K
			result.MonthlyCostTotal += stat.EstimatedCost
		}
	}

	if result.MonthlyCostTotal > 0 {
		result.ROI = result.TotalRevenuePaid / result.MonthlyCostTotal
	}
	return result, nil
}
