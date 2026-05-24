package controller

import (
	"net/http"

	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

func GetAdminAnalyticsDashboard(c *gin.Context) {
	priceMap := map[string]model.AgentCostUnit{
		"DRAMA": {InputPricePer1K: 0.0015, OutputPricePer1K: 0.0020},
		"MUSIC": {InputPricePer1K: 0.0020, OutputPricePer1K: 0.0025},
		"AD":    {InputPricePer1K: 0.0012, OutputPricePer1K: 0.0018},
		"GAME":  {InputPricePer1K: 0.0018, OutputPricePer1K: 0.0022},
	}

	data, err := model.GetAdminDashboardAnalytics(priceMap)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    data,
	})
}
