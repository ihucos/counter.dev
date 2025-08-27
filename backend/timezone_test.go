package main

import (
	"testing"
	"time"

	"github.com/ihucos/counter.dev/models"
)

func TestDSTTransitions(t *testing.T) {
	tests := []struct {
		name           string
		timezone       string
		date           string // Format: "2006-01-02 15:04"
		expectedOffset int    // Expected offset in minutes
	}{
		// US Eastern Time DST transitions
		{
			name:           "US/Eastern before DST (winter)",
			timezone:       "America/New_York",
			date:           "2024-01-15 12:00",
			expectedOffset: -300, // UTC-5 = -300 minutes
		},
		{
			name:           "US/Eastern during DST (summer)",
			timezone:       "America/New_York",
			date:           "2024-07-15 12:00",
			expectedOffset: -240, // UTC-4 = -240 minutes
		},
		{
			name:           "US/Eastern DST transition spring forward",
			timezone:       "America/New_York",
			date:           "2024-03-10 07:00", // 2AM becomes 3AM
			expectedOffset: -240,               // Should be in DST
		},
		{
			name:           "US/Eastern DST transition fall back",
			timezone:       "America/New_York",
			date:           "2024-11-03 06:00", // 2AM becomes 1AM
			expectedOffset: -300,               // Should be back to standard time
		},

		// European Time DST transitions
		{
			name:           "Europe/Berlin before DST (winter)",
			timezone:       "Europe/Berlin",
			date:           "2024-01-15 12:00",
			expectedOffset: 60, // UTC+1 = 60 minutes
		},
		{
			name:           "Europe/Berlin during DST (summer)",
			timezone:       "Europe/Berlin",
			date:           "2024-07-15 12:00",
			expectedOffset: 120, // UTC+2 = 120 minutes
		},
		{
			name:           "Europe/Berlin DST transition spring forward",
			timezone:       "Europe/Berlin",
			date:           "2024-03-31 03:00", // 2AM becomes 3AM
			expectedOffset: 120,                // Should be in DST
		},
		{
			name:           "Europe/Berlin DST transition fall back",
			timezone:       "Europe/Berlin",
			date:           "2024-10-27 02:00", // 3AM becomes 2AM
			expectedOffset: 60,                 // Should be back to standard time
		},

		// Australia DST (opposite hemisphere)
		{
			name:           "Australia/Sydney during southern winter (no DST)",
			timezone:       "Australia/Sydney",
			date:           "2024-07-15 12:00",
			expectedOffset: 600, // UTC+10 = 600 minutes
		},
		{
			name:           "Australia/Sydney during southern summer (DST)",
			timezone:       "Australia/Sydney",
			date:           "2024-01-15 12:00",
			expectedOffset: 660, // UTC+11 = 660 minutes
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			loc, err := time.LoadLocation(tt.timezone)
			if err != nil {
				t.Fatalf("Failed to load timezone %s: %v", tt.timezone, err)
			}

			// Parse the test date in the given timezone
			testTime, err := time.ParseInLocation("2006-01-02 15:04", tt.date, loc)
			if err != nil {
				t.Fatalf("Failed to parse test date %s: %v", tt.date, err)
			}

			// Calculate the actual offset in minutes
			_, actualOffsetSeconds := testTime.Zone()
			actualOffsetMinutes := actualOffsetSeconds / 60

			if actualOffsetMinutes != tt.expectedOffset {
				t.Errorf("Expected offset %d minutes, got %d minutes for %s at %s",
					tt.expectedOffset, actualOffsetMinutes, tt.timezone, tt.date)
			}
		})
	}
}

func TestFractionalTimezones(t *testing.T) {
	tests := []struct {
		name           string
		timezone       string
		expectedOffset int // Expected offset in minutes
	}{
		// Half-hour offsets
		{
			name:           "India Standard Time (+5:30)",
			timezone:       "Asia/Kolkata",
			expectedOffset: 330, // UTC+5:30 = 330 minutes
		},
		{
			name:           "Iran Standard Time (+3:30)",
			timezone:       "Asia/Tehran",
			expectedOffset: 210, // UTC+3:30 = 210 minutes (winter)
		},
		{
			name:           "Afghanistan Time (+4:30)",
			timezone:       "Asia/Kabul",
			expectedOffset: 270, // UTC+4:30 = 270 minutes
		},
		{
			name:           "Myanmar Time (+6:30)",
			timezone:       "Asia/Yangon",
			expectedOffset: 390, // UTC+6:30 = 390 minutes
		},
		{
			name:           "Newfoundland Standard Time (-3:30)",
			timezone:       "America/St_Johns",
			expectedOffset: -210, // UTC-3:30 = -210 minutes (winter)
		},

		// Quarter-hour offsets
		{
			name:           "Nepal Time (+5:45)",
			timezone:       "Asia/Kathmandu",
			expectedOffset: 345, // UTC+5:45 = 345 minutes
		},
		{
			name:           "Chatham Daylight Time (+13:45)",
			timezone:       "Pacific/Chatham",
			expectedOffset: 825, // UTC+13:45 = 825 minutes (summer DST)
		},
	}

	// Test during January - note: Southern hemisphere zones like Chatham are in summer DST
	testDate := "2024-01-15 12:00"

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			loc, err := time.LoadLocation(tt.timezone)
			if err != nil {
				t.Fatalf("Failed to load timezone %s: %v", tt.timezone, err)
			}

			// Parse the test date in the given timezone
			testTime, err := time.ParseInLocation("2006-01-02 15:04", testDate, loc)
			if err != nil {
				t.Fatalf("Failed to parse test date %s: %v", testDate, err)
			}

			// Calculate the actual offset in minutes
			_, actualOffsetSeconds := testTime.Zone()
			actualOffsetMinutes := actualOffsetSeconds / 60

			if actualOffsetMinutes != tt.expectedOffset {
				t.Errorf("Expected offset %d minutes, got %d minutes for %s",
					tt.expectedOffset, actualOffsetMinutes, tt.timezone)
			}
		})
	}
}

func TestUserTimezoneResolution(t *testing.T) {
	tests := []struct {
		name             string
		timezone         string
		expectedTimezone string
		shouldError      bool
	}{
		{
			name:             "Valid IANA timezone",
			timezone:         "Europe/Berlin",
			expectedTimezone: "Europe/Berlin",
			shouldError:      false,
		},
		{
			name:             "UTC timezone",
			timezone:         "UTC",
			expectedTimezone: "UTC",
			shouldError:      false,
		},
		{
			name:             "US Eastern timezone",
			timezone:         "America/New_York",
			expectedTimezone: "America/New_York",
			shouldError:      false,
		},
		{
			name:        "Invalid timezone should error",
			timezone:    "Invalid/Timezone",
			shouldError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Test timezone loading directly
			location, err := time.LoadLocation(tt.timezone)

			if tt.shouldError {
				if err == nil {
					t.Errorf("Expected error for invalid timezone %s, got none", tt.timezone)
				}
			} else {
				if err != nil {
					t.Fatalf("Expected valid timezone, got error: %v", err)
				}
				if location.String() != tt.expectedTimezone {
					t.Errorf("Expected timezone %s, got %s", tt.expectedTimezone, location.String())
				}
			}
		})
	}
}

func TestTimezoneAwareDateParsing(t *testing.T) {
	tests := []struct {
		name         string
		timezone     string
		dateString   string
		expectedHour int // Expected hour in UTC
	}{
		{
			name:         "New York midnight becomes 5 AM UTC (EST)",
			timezone:     "America/New_York",
			dateString:   "2024-01-15", // Winter (EST)
			expectedHour: 5,            // 00:00 EST = 05:00 UTC
		},
		{
			name:         "New York midnight becomes 4 AM UTC (EDT)",
			timezone:     "America/New_York",
			dateString:   "2024-07-15", // Summer (EDT)
			expectedHour: 4,            // 00:00 EDT = 04:00 UTC
		},
		{
			name:         "Berlin midnight becomes 11 PM UTC (CET)",
			timezone:     "Europe/Berlin",
			dateString:   "2024-01-15", // Winter (CET)
			expectedHour: 23,           // 00:00 CET = 23:00 UTC (previous day)
		},
		{
			name:         "Berlin midnight becomes 10 PM UTC (CEST)",
			timezone:     "Europe/Berlin",
			dateString:   "2024-07-15", // Summer (CEST)
			expectedHour: 22,           // 00:00 CEST = 22:00 UTC (previous day)
		},
		{
			name:         "India midnight with fractional offset",
			timezone:     "Asia/Kolkata",
			dateString:   "2024-01-15",
			expectedHour: 18, // 00:00 IST (+5:30) = 18:30 UTC (previous day)
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			loc, err := time.LoadLocation(tt.timezone)
			if err != nil {
				t.Fatalf("Failed to load timezone %s: %v", tt.timezone, err)
			}

			// Parse date at midnight in the given timezone
			localTime, err := time.ParseInLocation("2006-01-02", tt.dateString, loc)
			if err != nil {
				t.Fatalf("Failed to parse date %s: %v", tt.dateString, err)
			}

			// Convert to UTC and check the hour
			utcTime := localTime.UTC()
			if utcTime.Hour() != tt.expectedHour {
				t.Errorf("Expected UTC hour %d, got %d for %s midnight in %s",
					tt.expectedHour, utcTime.Hour(), tt.dateString, tt.timezone)
			}
		})
	}
}

func TestTimezoneOffsetCalculation(t *testing.T) {
	// Test the new offset calculation used in dump endpoint
	tests := []struct {
		name               string
		timezone           string
		testTime           string
		expectedOffsetMins int
	}{
		{
			name:               "UTC should have 0 offset",
			timezone:           "UTC",
			testTime:           "2024-01-15 12:00",
			expectedOffsetMins: 0,
		},
		{
			name:               "New York winter time",
			timezone:           "America/New_York",
			testTime:           "2024-01-15 12:00",
			expectedOffsetMins: -300, // UTC-5
		},
		{
			name:               "New York summer time",
			timezone:           "America/New_York",
			testTime:           "2024-07-15 12:00",
			expectedOffsetMins: -240, // UTC-4
		},
		{
			name:               "India with fractional offset",
			timezone:           "Asia/Kolkata",
			testTime:           "2024-01-15 12:00",
			expectedOffsetMins: 330, // UTC+5:30
		},
		{
			name:               "Nepal with quarter-hour offset",
			timezone:           "Asia/Kathmandu",
			testTime:           "2024-01-15 12:00",
			expectedOffsetMins: 345, // UTC+5:45
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			loc, err := time.LoadLocation(tt.timezone)
			if err != nil {
				t.Fatalf("Failed to load timezone %s: %v", tt.timezone, err)
			}

			testTime, err := time.ParseInLocation("2006-01-02 15:04", tt.testTime, loc)
			if err != nil {
				t.Fatalf("Failed to parse test time: %v", err)
			}

			// Calculate offset in minutes (same logic as in dump.go)
			_, offsetSeconds := testTime.Zone()
			offsetMinutes := offsetSeconds / 60

			if offsetMinutes != tt.expectedOffsetMins {
				t.Errorf("Expected offset %d minutes, got %d minutes for %s at %s",
					tt.expectedOffsetMins, offsetMinutes, tt.timezone, tt.testTime)
			}
		})
	}
}

func TestUserTimezoneMigration(t *testing.T) {
	tests := []struct {
		name                string
		utcOffset           int
		expectedSuggestions []string
	}{
		{
			name:      "UTC-5 should suggest US Eastern",
			utcOffset: -5,
			expectedSuggestions: []string{
				"America/New_York",
				"America/Toronto",
				"America/Bogota",
			},
		},
		{
			name:      "UTC+1 should suggest European zones",
			utcOffset: 1,
			expectedSuggestions: []string{
				"Europe/Paris",
				"Europe/Berlin",
				"Europe/Rome",
			},
		},
		{
			name:      "UTC+5 should suggest Central Asian zones",
			utcOffset: 5,
			expectedSuggestions: []string{
				"Asia/Karachi",
				"Asia/Tashkent",
			},
		},
		{
			name:                "Invalid offset should return UTC fallback",
			utcOffset:           25, // Invalid
			expectedSuggestions: []string{"UTC"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			suggestions := models.SuggestTimezoneFromOffset(tt.utcOffset)

			if len(suggestions) == 0 && len(tt.expectedSuggestions) > 0 {
				t.Errorf("Expected suggestions %v, got empty list", tt.expectedSuggestions)
				return
			}

			// Check that all expected suggestions are present
			for _, expected := range tt.expectedSuggestions {
				found := false
				for _, suggestion := range suggestions {
					if suggestion == expected {
						found = true
						break
					}
				}
				if !found {
					t.Errorf("Expected suggestion %s not found in %v", expected, suggestions)
				}
			}
		})
	}
}

func TestDSTBoundaryConditions(t *testing.T) {
	// Test edge cases around DST transitions
	tests := []struct {
		name     string
		timezone string
		dateTime string
		expected bool // Whether DST should be active
	}{
		{
			name:     "US Eastern just before spring DST",
			timezone: "America/New_York",
			dateTime: "2024-03-10 01:59", // 1:59 AM EST, before 2 AM jump
			expected: false,              // Still standard time
		},
		{
			name:     "US Eastern just after spring DST",
			timezone: "America/New_York",
			dateTime: "2024-03-10 03:01", // 3:01 AM EDT, after 2 AM jump
			expected: true,               // Now daylight time
		},
		{
			name:     "Europe Berlin just before spring DST",
			timezone: "Europe/Berlin",
			dateTime: "2024-03-31 00:59", // 1:59 AM CET, before 2 AM jump
			expected: false,              // Still standard time
		},
		{
			name:     "Europe Berlin just after spring DST",
			timezone: "Europe/Berlin",
			dateTime: "2024-03-31 03:01", // 3:01 AM CEST, after 2 AM jump
			expected: true,               // Now daylight time
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			loc, err := time.LoadLocation(tt.timezone)
			if err != nil {
				t.Fatalf("Failed to load timezone %s: %v", tt.timezone, err)
			}

			testTime, err := time.ParseInLocation("2006-01-02 15:04", tt.dateTime, loc)
			if err != nil {
				t.Fatalf("Failed to parse test time: %v", err)
			}

			// Check if DST is active by examining the zone abbreviation
			zoneName, _ := testTime.Zone()
			isDST := false

			// Common DST patterns
			if tt.timezone == "America/New_York" {
				isDST = zoneName == "EDT" // Eastern Daylight Time
			} else if tt.timezone == "Europe/Berlin" {
				isDST = zoneName == "CEST" // Central European Summer Time
			}

			if isDST != tt.expected {
				t.Errorf("Expected DST=%v for %s at %s, got DST=%v (zone: %s)",
					tt.expected, tt.timezone, tt.dateTime, isDST, zoneName)
			}
		})
	}
}
