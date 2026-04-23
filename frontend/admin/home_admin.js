
    const users = [
      {
        id: 1,
        name: "Thanakrit Phortimart",
        email: "thanakrit@student.com",
        role: "student",
        status: "approved",
        createdAt: "2026-04-10"
      },
      {
        id: 2,
        name: "Boss Dev Tutor",
        email: "boss@tutor.com",
        role: "tutor",
        status: "pending",
        createdAt: "2026-04-12"
      },
      {
        id: 3,
        name: "Mint Physics",
        email: "mint@tutor.com",
        role: "tutor",
        status: "approved",
        createdAt: "2026-04-08"
      },
      {
        id: 4,
        name: "Admin Main",
        email: "admin@system.com",
        role: "admin",
        status: "approved",
        createdAt: "2026-04-01"
      },
      {
        id: 5,
        name: "Test Trouble User",
        email: "baduser@test.com",
        role: "student",
        status: "banned",
        createdAt: "2026-04-14"
      }
    ];

    const activities = [
      {
        title: "มีติวเตอร์สมัครใหม่",
        meta: "5 นาทีที่แล้ว",
        desc: "บัญชี Boss Dev Tutor สมัครเข้าระบบและกำลังรอการอนุมัติจากผู้ดูแล"
      },
      {
        title: "โพสต์ใหม่ถูกสร้าง",
        meta: "12 นาทีที่แล้ว",
        desc: "นักเรียนได้สร้างประกาศใหม่ในหมวด Java Programming และต้องการติวเตอร์ด่วน"
      },
      {
        title: "มีการระงับบัญชี",
        meta: "30 นาทีที่แล้ว",
        desc: "บัญชี Test Trouble User ถูกระงับเนื่องจากมีรายงานพฤติกรรมไม่เหมาะสม"
      },
      {
        title: "ประกาศระบบถูกอัปเดต",
        meta: "1 ชั่วโมงที่แล้ว",
        desc: "ผู้ดูแลได้แก้ไขข้อความประกาศส่วนกลางของระบบเรียบร้อย"
      }
    ];

    const reports = [
      {
        title: "รายงานติวเตอร์ไม่มาตามนัด",
        meta: "โดย Student A • ระดับความสำคัญ: สูง",
        desc: "นักเรียนแจ้งว่าติวเตอร์ไม่เข้าคลาสตามเวลาที่กำหนดและไม่ตอบกลับข้อความ"
      },
      {
        title: "รายงานโพสต์ข้อมูลไม่เหมาะสม",
        meta: "โดย Tutor B • ระดับความสำคัญ: กลาง",
        desc: "พบข้อความในประกาศที่มีคำไม่เหมาะสม ควรตรวจสอบและซ่อนโพสต์ดังกล่าว"
      },
      {
        title: "สงสัยบัญชีปลอม",
        meta: "โดย User C • ระดับความสำคัญ: สูง",
        desc: "มีผู้ใช้แจ้งว่าพบพฤติกรรมคล้ายบัญชีปลอมและอาจสร้างข้อมูลเท็จในระบบ"
      }
    ];

    let filteredUsers = [...users];

    function scrollToSection(id) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    function getRoleText(role) {
      if (role === "student") return "นักเรียน";
      if (role === "tutor") return "ติวเตอร์";
      return "แอดมิน";
    }

    function getStatusBadge(status) {
      if (status === "approved") {
        return `<span class="badge badge-approved">อนุมัติแล้ว</span>`;
      }
      if (status === "pending") {
        return `<span class="badge badge-pending">รออนุมัติ</span>`;
      }
      return `<span class="badge badge-banned">ระงับ</span>`;
    }

    function renderUsers() {
      const tbody = document.getElementById("userTableBody");

      if (filteredUsers.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align:center; color:#aab3dd;">
              ไม่พบข้อมูลผู้ใช้ตามเงื่อนไขที่ค้นหา
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filteredUsers.map(user => `
        <tr>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${getRoleText(user.role)}</td>
          <td>${getStatusBadge(user.status)}</td>
          <td>${user.createdAt}</td>
          <td>
            <div class="action-buttons">
              <button class="small-btn view-btn" onclick="viewUser(${user.id})">ดู</button>
              <button class="small-btn approve-btn" onclick="approveUser(${user.id})">อนุมัติ</button>
              <button class="small-btn ban-btn" onclick="banUser(${user.id})">ระงับ</button>
            </div>
          </td>
        </tr>
      `).join("");
    }

    function renderActivities() {
      const activityList = document.getElementById("activityList");
      activityList.innerHTML = activities.map(item => `
        <div class="activity-card">
          <div class="activity-top">
            <div>
              <div class="activity-title">${item.title}</div>
              <div class="activity-meta">${item.meta}</div>
            </div>
            <span class="badge badge-approved">NEW</span>
          </div>
          <div class="activity-desc">${item.desc}</div>
        </div>
      `).join("");
    }

    function renderReports() {
      const reportList = document.getElementById("reportList");
      reportList.innerHTML = reports.map(item => `
        <div class="report-card">
          <div class="report-top">
            <div>
              <div class="report-title">${item.title}</div>
              <div class="report-meta">${item.meta}</div>
            </div>
            <span class="badge badge-pending">ตรวจสอบ</span>
          </div>
          <div class="report-desc">${item.desc}</div>
        </div>
      `).join("");
    }

    function updateStats() {
      const students = users.filter(u => u.role === "student").length;
      const tutors = users.filter(u => u.role === "tutor").length;
      const posts = 18;
      const totalReports = reports.length;

      document.getElementById("totalStudents").textContent = students;
      document.getElementById("totalTutors").textContent = tutors;
      document.getElementById("totalPosts").textContent = posts;
      document.getElementById("totalReports").textContent = totalReports;

      document.getElementById("heroUsers").textContent = users.length;
      document.getElementById("heroTutors").textContent = tutors;
      document.getElementById("heroPosts").textContent = posts;
      document.getElementById("heroReports").textContent = totalReports;

      const pending = users.filter(u => u.status === "pending").length;
      const banned = users.filter(u => u.status === "banned").length;

      document.getElementById("pendingBadgeCount").textContent = `${pending} รายการ`;
      document.getElementById("bannedBadgeCount").textContent = `${banned} รายการ`;
    }

    function filterUsers() {
      const search = document.getElementById("searchInput").value.toLowerCase().trim();
      const role = document.getElementById("roleFilter").value;
      const status = document.getElementById("statusFilter").value;

      filteredUsers = users.filter(user => {
        const matchSearch =
          user.name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search) ||
          user.role.toLowerCase().includes(search);

        const matchRole = role === "all" ? true : user.role === role;
        const matchStatus = status === "all" ? true : user.status === status;

        return matchSearch && matchRole && matchStatus;
      });

      renderUsers();
    }

    function viewUser(id) {
      const user = users.find(u => u.id === id);
      if (!user) return;

      alert(
        `ชื่อ: ${user.name}\n` +
        `อีเมล: ${user.email}\n` +
        `บทบาท: ${getRoleText(user.role)}\n` +
        `สถานะ: ${user.status}\n` +
        `วันที่สมัคร: ${user.createdAt}`
      );
    }

    function approveUser(id) {
      const user = users.find(u => u.id === id);
      if (!user) return;

      user.status = "approved";
      filterUsers();
      updateStats();
      alert(`อนุมัติผู้ใช้ ${user.name} เรียบร้อยแล้ว`);
    }

    function banUser(id) {
      const user = users.find(u => u.id === id);
      if (!user) return;

      const confirmBan = confirm(`ต้องการระงับผู้ใช้ ${user.name} ใช่หรือไม่?`);
      if (!confirmBan) return;

      user.status = "banned";
      filterUsers();
      updateStats();
      alert(`ระงับผู้ใช้ ${user.name} เรียบร้อยแล้ว`);
    }

    function refreshDashboard() {
      filterUsers();
      renderActivities();
      renderReports();
      updateStats();
      alert("รีเฟรชข้อมูลหน้า Admin Dashboard เรียบร้อย");
    }

    document.getElementById("logout").addEventListener("click", function () {
      if (!confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) return;
      localStorage.removeItem("token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_id");
      window.location.href = "/login";
    });

    filterUsers();
    renderActivities();
    renderReports();
    updateStats();
