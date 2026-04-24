/**
 * home_admin.js
 * จัดการส่วนหน้าของ Admin Dashboard - Tutor Match
 */

// 1. กำหนดตัวแปรสำหรับเก็บข้อมูล
let users = [];
let filteredUsers = [];
let reports = [];

// 2. ตั้งค่า Authentication
const token = localStorage.getItem("token");
const apiHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
};

// --- ส่วนที่ 1: การดึงข้อมูลจาก API (/admin/...) ---

/** ดึงสถิติตัวเลขสรุปทั้งหมด */
async function fetchStats() {
    try {
        const response = await fetch("/admin/stats", { headers: apiHeaders });
        const result = await response.json();

        if (result.status === "success") {
            const data = result.data;
            // อัปเดตตัวเลขใน overview-grid
            document.getElementById("totalStudents").textContent = data.students;
            document.getElementById("totalTutors").textContent = data.tutors;
            document.getElementById("totalPosts").textContent = data.posts;
            document.getElementById("totalReports").textContent = data.reports;

            // อัปเดตตัวเลขใน hero section
            document.getElementById("heroUsers").textContent = data.total_users;
            document.getElementById("heroTutors").textContent = data.tutors;
            document.getElementById("heroPosts").textContent = data.posts;
            document.getElementById("heroReports").textContent = data.reports;

            // อัปเดตตัวเลข Badge ด้านล่าง
            document.getElementById("pendingBadgeCount").textContent =
                `${data.pending} รายการ`;
            document.getElementById("bannedBadgeCount").textContent =
                `${data.banned} รายการ`;
        } else {
            console.error("Failed to fetch stats:", result.message);
        }
    } catch (error) {
        console.error("Error fetching stats:", error);
    }
}

/** ดึงรายชื่อผู้ใช้ทั้งหมด */
async function fetchUsers() {
    try {
        const response = await fetch("/admin/users", { headers: apiHeaders });
        const result = await response.json();

        if (result.status === "success") {
            users = result.data;
            filterUsers(); // เมื่อได้ข้อมูลมาแล้วให้ทำการ Render ตารางทันที
        }
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

/** ดึงรายการรายงานปัญหา */
async function fetchReports() {
    try {
        const response = await fetch("/admin/reports", { headers: apiHeaders });
        const result = await response.json();

        if (result.status === "success") {
            reports = result.data;
            renderReports();
        }
    } catch (error) {
        console.error("Error fetching reports:", error);
    }
}

// --- ส่วนที่ 2: ฟังก์ชันจัดการผู้ใช้ (Update Status) ---

/** อนุมัติผู้ใช้ (เปลี่ยนสถานะเป็น active) */
async function approveUser(id) {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    try {
        const response = await fetch("/admin/users/status", {
            method: "POST",
            headers: apiHeaders,
            body: JSON.stringify({ user_id: id, status: "approved" }),
        });
        const result = await response.json();

        if (result.status === "success") {
            alert(`อนุมัติผู้ใช้ ${user.name} เรียบร้อยแล้ว`);
            refreshData(); // โหลดข้อมูลใหม่
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
}

/** ระงับการใช้งานผู้ใช้ (เปลี่ยนสถานะเป็น ban) */
async function banUser(id) {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    if (!confirm(`ต้องการระงับผู้ใช้ ${user.name} ใช่หรือไม่?`)) return;

    try {
        const response = await fetch("/admin/users/status", {
            method: "POST",
            headers: apiHeaders,
            body: JSON.stringify({
                user_id: id,
                status: "banned",
                reason: "ถูกระงับโดยผู้ดูแลระบบ",
            }),
        });
        const result = await response.json();

        if (result.status === "success") {
            alert(`ระงับผู้ใช้ ${user.name} เรียบร้อยแล้ว`);
            refreshData(); // โหลดข้อมูลใหม่
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
}

// --- ส่วนที่ 3: UI Rendering และ Helpers ---

function getRoleText(role) {
    if (role === "student") return "นักเรียน";
    if (role === "tutor") return "ติวเตอร์";
    return "แอดมิน";
}

function getStatusBadge(status) {
    // รองรับสถานะจาก Database: 'active', 'suspended', 'ban', 'pending'
    if (status === "active" || status === "approved") {
        return `<span class="badge badge-approved">ใช้งานปกติ</span>`;
    }
    if (status === "pending") {
        return `<span class="badge badge-pending">รออนุมัติ</span>`;
    }
    return `<span class="badge badge-banned">ถูกระงับ</span>`;
}

/** กรองรายชื่อผู้ใช้จากคำค้นหาและ Filter */
function filterUsers() {
    const search = document
        .getElementById("searchInput")
        .value.toLowerCase()
        .trim();
    const role = document.getElementById("roleFilter").value;
    const status = document.getElementById("statusFilter").value;

    filteredUsers = users.filter((user) => {
        const uName = (user.name || "").toLowerCase();
        const uEmail = (user.email || "").toLowerCase();

        const matchSearch = uName.includes(search) || uEmail.includes(search);
        const matchRole = role === "all" ? true : user.role === role;

        // ตรวจสอบเงื่อนไขสถานะให้ตรงกับ UI Filter
        let filterStatus = "all";
        if (
            status === "approved" &&
            (user.status === "active" || user.status === "approved")
        )
            filterStatus = status;
        if (
            status === "banned" &&
            (user.status === "ban" || user.status === "suspended")
        )
            filterStatus = status;
        if (status === "pending" && user.status === "pending")
            filterStatus = status;

        const matchStatus = status === "all" ? true : filterStatus === status;

        return matchSearch && matchRole && matchStatus;
    });

    renderUsers();
}

/** แสดงผลตารางผู้ใช้ */
function renderUsers() {
    const tbody = document.getElementById("userTableBody");
    if (filteredUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#aab3dd; padding: 20px;">ไม่พบข้อมูลผู้ใช้</td></tr>`;
        return;
    }
    tbody.innerHTML = filteredUsers
        .map(
            (user) => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${getRoleText(user.role)}</td>
            <td>${getStatusBadge(user.status)}</td>
            <td>${user.createdAt || "-"}</td>
            <td>
                <div class="action-buttons">
                    <button class="small-btn view-btn" onclick="viewUser(${user.id})">ดู</button>
                    <button class="small-btn approve-btn" onclick="approveUser(${user.id})">อนุมัติ</button>
                    <button class="small-btn ban-btn" onclick="banUser(${user.id})">ระงับ</button>
                </div>
            </td>
        </tr>
    `,
        )
        .join("");
}

/** แสดงผลรายการรายงานปัญหา */
function renderReports() {
    const reportList = document.getElementById("reportList");
    if (reports.length === 0) {
        reportList.innerHTML = `<div style="text-align:center; padding: 20px; color:#aab3dd;">ไม่มีรายงานปัญหาใหม่ 🎉</div>`;
        return;
    }

    const statusBadge = {
        pending:       `<span class="badge badge-pending">รอตรวจสอบ</span>`,
        investigating: `<span class="badge badge-pending">กำลังตรวจสอบ</span>`,
        resolved:      `<span class="badge badge-approved">แก้ไขแล้ว</span>`,
        dismissed:     `<span class="badge badge-banned">ยกเลิก</span>`,
    };

    const targetLabel = {
        user: 'ผู้ใช้', post: 'โพสต์', review: 'รีวิว', other: 'อื่นๆ'
    };

    reportList.innerHTML = reports.map((item) => `
        <div class="report-card">
            <div class="report-top">
                <div>
                    <div class="report-title">${item.title}</div>
                    <div class="report-meta">
                        รายงานโดย: ${item.reporter_name} (${item.reporter_email}) &nbsp;•&nbsp;
                        เป้าหมาย: ${targetLabel[item.target_type] || item.target_type} #${item.target_id || '-'} &nbsp;•&nbsp;
                        ${item.created_at || ''}
                    </div>
                </div>
                ${statusBadge[item.status] || statusBadge.pending}
            </div>
            <div class="report-desc">${item.description || ''}</div>
        </div>
    `).join("");
}

// --- ส่วนที่ 4: Navigation และเครื่องมือ Dashboard ---

function viewUser(id) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    alert(
        `[ข้อมูลผู้ใช้]\nชื่อ: ${user.name}\nอีเมล: ${user.email}\nบทบาท: ${getRoleText(user.role)}\nสถานะ: ${user.status}`,
    );
}

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function refreshDashboard() {
    refreshData();
    alert("รีเฟรชข้อมูลล่าสุดเรียบร้อย");
}

function refreshData() {
    fetchStats();
    fetchUsers();
    fetchReports();
}

// Logout
document.getElementById("logout").addEventListener("click", function () {
    if (!confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) return;
    localStorage.clear(); // ล้างข้อมูลการเข้าสู่ระบบทั้งหมด
    window.location.href = "/login";
});

// --- ส่วนที่ 5: เริ่มการทำงาน (Initial Calls) ---

// ข้อมูลกิจกรรมล่าสุด (Mock ข้อมูลไว้ก่อนจนกว่าจะทำตาราง logs)
const activities = [
    {
        title: "ระบบเชื่อมต่อสำเร็จ",
        meta: "เมื่อสักครู่",
        desc: "Admin Dashboard ทำการดึงข้อมูลจาก Database เรียบร้อยแล้ว",
    },
];

function renderActivities() {
    const activityList = document.getElementById("activityList");
    activityList.innerHTML = activities
        .map(
            (item) => `
        <div class="activity-card">
            <div class="activity-top">
                <div>
                    <div class="activity-title">${item.title}</div>
                    <div class="activity-meta">${item.meta}</div>
                </div>
                <span class="badge badge-approved">SYSTEM</span>
            </div>
            <div class="activity-desc">${item.desc}</div>
        </div>
    `,
        )
        .join("");
}

// เรียกใช้งานฟังก์ชันเริ่มต้น
renderActivities();
refreshData();