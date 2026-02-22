/*
  Intel Summit Check-In JavaScript
  - Handles check-ins, team counts, progress bar, celebration, and persistence
  - Beginner-friendly code with comments and functions
*/

// ---------- DOM References ----------
const form = document.getElementById("checkInForm");
const nameInput = document.getElementById("attendeeName");
const teamSelect = document.getElementById("teamSelect");
const greetingEl = document.getElementById("greeting"); // Where we show the welcome message
const totalCountEl = document.getElementById("attendeeCount"); // Total attendance display (matches HTML)
const progressBarEl = document.getElementById("progressBar"); // Inner bar element to set width
const progressLabelEl = document.getElementById("progressLabel"); // Optional label for percent
var attendeeListEl = document.getElementById("attendeeList"); // Where we list attendees (may be created)
var celebrationEl = document.getElementById("celebration"); // Celebration message container

// ---------- Constants & State ----------
const ATTENDANCE_GOAL = 50;

// Storage keys
const STORAGE_TOTAL = "intel_total";
const STORAGE_TEAMS = "intel_teams";
const STORAGE_ATTENDEES = "intel_attendees";
const STORAGE_CELEBRATION = "intel_celebrationShown";

// Runtime state (will be restored from localStorage if available)
let totalAttendance = 0;
let teams = {
  // keys should match the select option values in the HTML (e.g., "water", "netzero", "renewables")
};
let attendees = []; // Array of { name, teamKey, teamLabel }
let celebrationShown = false; // Ensure celebration triggers once

// ---------- Storage Helpers ----------
// Save current state to localStorage
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_TOTAL, String(totalAttendance));
    localStorage.setItem(STORAGE_TEAMS, JSON.stringify(teams));
    localStorage.setItem(STORAGE_ATTENDEES, JSON.stringify(attendees));
    localStorage.setItem(STORAGE_CELEBRATION, celebrationShown ? "1" : "0");
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
}

// Load state from localStorage (if present)
function loadFromStorage() {
  try {
    const sTotal = localStorage.getItem(STORAGE_TOTAL);
    const sTeams = localStorage.getItem(STORAGE_TEAMS);
    const sAtt = localStorage.getItem(STORAGE_ATTENDEES);
    const sCelebration = localStorage.getItem(STORAGE_CELEBRATION);

    if (sTotal !== null) {
      totalAttendance = parseInt(sTotal, 10) || 0;
    }

    if (sTeams) {
      teams = JSON.parse(sTeams);
    }

    if (sAtt) {
      attendees = JSON.parse(sAtt);
    }

    if (sCelebration === "1") {
      celebrationShown = true;
    }
  } catch (e) {
    console.error("Failed to load from localStorage:", e);
  }
}

// ---------- UI Update Helpers ----------
// Update counts for total and each team on the page
function updateCountsDisplay() {
  // Total
  if (totalCountEl) {
    totalCountEl.textContent = String(totalAttendance);
  }

  // For each team in teams object, try to update an element with id `${teamKey}Count`
  Object.keys(teams).forEach(function (teamKey) {
    var el = document.getElementById(teamKey + "Count");
    if (el) {
      el.textContent = String(teams[teamKey]);
    }
  });
}

// Update the progress bar UI and label
function updateProgressBar() {
  var percent = Math.round((totalAttendance / ATTENDANCE_GOAL) * 100);
  if (percent > 100) {
    percent = 100;
  }

  if (progressBarEl) {
    progressBarEl.style.width = percent + "%";
  }

  if (progressLabelEl) {
    progressLabelEl.textContent = percent + "%";
  }
}

// Add a single attendee to the visible list
function addAttendeeToList(att) {
  if (!attendeeListEl) {
    return;
  }

  var li = document.createElement("li");
  li.textContent = `${att.name} — ${att.teamLabel}`;
  attendeeListEl.appendChild(li);
}

// Rebuild full attendee list from `attendees` array
function rebuildAttendeeList() {
  if (!attendeeListEl) {
    return;
  }

  attendeeListEl.innerHTML = "";
  attendees.forEach(function (att) {
    addAttendeeToList(att);
  });
}

// Show greeting for the latest attendee
function showGreeting(name) {
  if (!greetingEl) {
    return;
  }
  greetingEl.textContent = `Welcome, ${name}! Thanks for checking in at the Intel Sustainability Summit.`;
  greetingEl.style.display = "block"; // Make visible (CSS hides it by default)
}

// Determine leading team(s). Returns an array of team keys.
function getLeadingTeams() {
  var max = -1;
  var leaders = [];
  Object.keys(teams).forEach(function (teamKey) {
    var val = teams[teamKey] || 0;
    if (val > max) {
      max = val;
      leaders = [teamKey];
    } else if (val === max) {
      leaders.push(teamKey);
    }
  });
  return leaders;
}

// Show celebration message once when goal reached
function tryCelebrate() {
  if (celebrationShown) {
    return; // already shown
  }

  if (totalAttendance >= ATTENDANCE_GOAL) {
    var leaders = getLeadingTeams();

    // Convert team keys to their display labels (try to read from select options)
    var leaderLabels = leaders.map(function (key) {
      var opt = teamSelect.querySelector(`option[value="${key}"]`);
      return opt ? opt.text : key;
    });

    var text = "🎉 ";
    if (leaderLabels.length === 1) {
      text += `Team ${leaderLabels[0]} is leading the Sustainability Summit!`;
    } else {
      text += `Teams ${leaderLabels.join(" and ")} are leading the Sustainability Summit!`;
    }

    if (celebrationEl) {
      celebrationEl.textContent = text;
      celebrationEl.style.display = "block";
    } else {
      // Fallback: use greeting area if no dedicated celebration element
      if (greetingEl) {
        greetingEl.textContent = text;
      }
    }

    celebrationShown = true;
    saveToStorage();
  }
}

// ---------- Main Check-in Handler ----------
function handleCheckIn(event) {
  if (event) {
    event.preventDefault();
  }

  var name = nameInput ? nameInput.value.trim() : "";
  if (!name) {
    // Ignore empty names
    return;
  }

  // Determine selected team (value and display text)
  var teamKey = "";
  var teamLabel = "";
  if (teamSelect) {
    teamKey = teamSelect.value;
    var selOpt = teamSelect.selectedOptions && teamSelect.selectedOptions[0];
    teamLabel = selOpt ? selOpt.text : teamKey;
  }

  // Ensure the team exists in our teams object
  if (!teams.hasOwnProperty(teamKey)) {
    teams[teamKey] = 0;
  }

  // Update state
  totalAttendance += 1;
  teams[teamKey] = (teams[teamKey] || 0) + 1;

  // Add to attendees list
  var attendee = { name: name, teamKey: teamKey, teamLabel: teamLabel };
  attendees.push(attendee);

  // Update UI
  showGreeting(name);
  updateCountsDisplay();
  updateProgressBar();
  addAttendeeToList(attendee);

  // Persist changes
  saveToStorage();

  // Check for celebration (only once)
  tryCelebrate();

  // Reset name input for next attendee
  if (nameInput) {
    nameInput.value = "";
    nameInput.focus();
  }
}

// ---------- Initialization ----------
function initialize() {
  // Build an initial teams object from the select options so we have consistent keys
  if (teamSelect) {
    var opts = teamSelect.options;
    for (var i = 0; i < opts.length; i++) {
      var o = opts[i];
      if (o.value) {
        if (!teams.hasOwnProperty(o.value)) {
          teams[o.value] = 0;
        }
      }
    }
  }

  // Load saved state (overwrites initial empty values where present)
  loadFromStorage();

  // After loading, ensure teams object has all keys from the select
  if (teamSelect) {
    var opts2 = teamSelect.options;
    for (var j = 0; j < opts2.length; j++) {
      var oo = opts2[j];
      if (oo.value && !teams.hasOwnProperty(oo.value)) {
        teams[oo.value] = 0;
      }
    }
  }

  // If attendee list element is not present in HTML, create it under the team-stats section
  if (!attendeeListEl) {
    var teamStats = document.querySelector(".team-stats");
    if (teamStats) {
      var wrapper = document.createElement("div");
      wrapper.className = "attendee-list-wrapper";
      var title = document.createElement("h4");
      title.textContent = "Attendees";
      var ul = document.createElement("ul");
      ul.id = "attendeeList";
      ul.className = "attendee-list";
      wrapper.appendChild(title);
      wrapper.appendChild(ul);
      teamStats.parentNode.insertBefore(wrapper, teamStats.nextSibling);
      attendeeListEl = document.getElementById("attendeeList");
    }
  }

  // If celebration element missing, create a small container below greeting
  if (!celebrationEl && greetingEl) {
    var c = document.createElement("div");
    c.id = "celebration";
    c.className = "celebration";
    c.style.display = "none";
    greetingEl.parentNode.insertBefore(c, greetingEl.nextSibling);
    celebrationEl = c;
  }

  // Update UI to reflect loaded state
  updateCountsDisplay();
  updateProgressBar();
  rebuildAttendeeList();

  // If celebration was already shown in earlier session, show it again
  if (celebrationShown) {
    tryCelebrate();
  }

  // Wire up form submit listener (use event listener, not inline handlers)
  if (form) {
    form.addEventListener("submit", handleCheckIn);
  }
}

// Run initialize when DOM is ready. If scripts are at bottom of page, this runs immediately.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
