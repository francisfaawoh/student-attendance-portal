document.addEventListener('DOMContentLoaded', function() {
    if (isAuthenticated()) {
        showAttendancePage();
        loadAttendanceRecords();
        updateAttendanceStatistics();
        setDefaultDate();
        updateClearDataButtonVisibility();
    } else {
        showLoginPage();
    }
});

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const user = authenticateUser(username, password);

    if (user) {
        localStorage.setItem('authenticated', 'true');
        localStorage.setItem('currentUser', username);
        localStorage.setItem('isAdmin', user.isAdmin); // Store admin status
        showAttendancePage();
        setDefaultDate();
        updateClearDataButtonVisibility();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
});

// Handle registration form submission
document.getElementById('register-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const isAdmin = document.getElementById('register-admin').checked; // Admin checkbox

    if (registerUser(username, password, isAdmin)) {
        alert('Registration successful! Please log in.');
        showLoginPage();
    } else {
        document.getElementById('register-error').style.display = 'block';
    }
});

// Handle logout button click
document.getElementById('logout-button').addEventListener('click', function() {
    localStorage.removeItem('authenticated');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAdmin');
    showLoginPage();
});

// Show registration page
document.getElementById('show-register').addEventListener('click', function(event) {
    event.preventDefault();
    showRegisterPage();
});

// Show login page
document.getElementById('show-login').addEventListener('click', function(event) {
    event.preventDefault();
    showLoginPage();
});

// Handle attendance form submission
document.getElementById('attendance-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const name = document.getElementById('student-name').value;
    const date = document.getElementById('date').value;
    const status = document.getElementById('status').value;
    const currentUser = localStorage.getItem('currentUser');

    if (name === '' || status === '') {
        alert('Please fill in all fields.');
        return;
    }

    if (hasUserSubmittedToday(currentUser, date)) {
        alert('You have already entered data for today.');
        return;
    }

    const record = { name, date, status, user: currentUser };
    let records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    records.push(record);
    localStorage.setItem('attendanceRecords', JSON.stringify(records));

    const table = document.getElementById('attendance-records').getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();
    newRow.insertCell(0).textContent = name;
    newRow.insertCell(1).textContent = date;
    newRow.insertCell(2).textContent = status;

    document.getElementById('attendance-form').reset();
    updateAttendanceStatistics();
});

// Handle clear data button click
document.getElementById('clear-data').addEventListener('click', function() {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (isAdmin) {
        if (confirm('Are you sure you want to clear all attendance data?')) {
            localStorage.removeItem('attendanceRecords');
            document.getElementById('attendance-records').getElementsByTagName('tbody')[0].innerHTML = '';
            document.getElementById('total-present').textContent = '0';
            document.getElementById('total-absent').textContent = '0';
        }
    } else {
        alert('You do not have permission to clear data.');
    }
});

// Handle download PDF button click
document.getElementById('download-pdf').addEventListener('click', function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.autoTable({ html: '#attendance-records' });

    const totalPresent = document.getElementById('total-present').textContent;
    const totalAbsent = document.getElementById('total-absent').textContent;
    const totalStudents = parseInt(totalPresent) + parseInt(totalAbsent);

    doc.text("Attendance Statistics:", 14, doc.lastAutoTable.finalY + 10);
    doc.text(`Total Present: ${totalPresent}`, 14, doc.lastAutoTable.finalY + 20);
    doc.text(`Total Absent: ${totalAbsent}`, 14, doc.lastAutoTable.finalY + 30);
    doc.text(`Total Students: ${totalStudents}`, 14, doc.lastAutoTable.finalY + 50);

    doc.save('attendance-records.pdf');
});

// Helper functions

function showLoginPage() {
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('register-container').style.display = 'none';
    document.getElementById('attendance-container').style.display = 'none';
}

function showRegisterPage() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'block';
    document.getElementById('attendance-container').style.display = 'none';
}

function showAttendancePage() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'none';
    document.getElementById('attendance-container').style.display = 'block';
}

function isAuthenticated() {
    return localStorage.getItem('authenticated') === 'true';
}

function authenticateUser(username, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    return users.find(user => user.username === username && user.password === password);
}

function registerUser(username, password, isAdmin) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.some(user => user.username === username)) {
        return false; // Username already exists
    }
    users.push({ username, password, isAdmin });
    localStorage.setItem('users', JSON.stringify(users));
    return true;
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

function loadAttendanceRecords() {
    const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const table = document.getElementById('attendance-records').getElementsByTagName('tbody')[0];
    records.forEach(record => {
        const newRow = table.insertRow();
        newRow.insertCell(0).textContent = record.name;
        newRow.insertCell(1).textContent = record.date;
        newRow.insertCell(2).textContent = record.status;
    });
}

function updateAttendanceStatistics() {
    const rows = document.getElementById('attendance-records').getElementsByTagName('tbody')[0].rows;
    let totalPresent = 0;
    let totalAbsent = 0;
    for (let row of rows) {
        const status = row.cells[2].textContent;
        if (status === 'Present') totalPresent++;
        if (status === 'Absent') totalAbsent++;   
    }
    document.getElementById('total-present').textContent = totalPresent;
    document.getElementById('total-absent').textContent = totalAbsent;
}

function hasUserSubmittedToday(username, date) {
    const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    return records.some(record => record.user === username && record.date === date);
}

function updateClearDataButtonVisibility() {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    document.getElementById('clear-data').style.display = isAdmin ? 'inline-block' : 'none';
}
