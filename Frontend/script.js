console.log("SCRIPT.JS IS CONNECTED");

const API_URL = "http://localhost:3000";



// -------------------------------------------------Load Book section------------------------------------------------------------

async function loadBooks() {
    const response = await fetch(`${API_URL}/books`);
    const books = await response.json();

    document.getElementById("totalBooks").textContent = books.length;

    const studentResponse = await fetch(`${API_URL}/students`);
    const students = await studentResponse.json();

    document.getElementById("totalStudents").textContent = students.length;

    const issueResponse = await fetch(`${API_URL}/issues`);
    const issues = await issueResponse.json();

    
const recentIssuesList = document.getElementById("recentIssuesList");

recentIssuesList.innerHTML = "";

const recentIssues = [...issues]
    .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
    .slice(0, 5);

for (const issue of recentIssues) {
    const fineResponse = await fetch(`${API_URL}/issues/${issue.id}/fine`);
    const fineData = await fineResponse.json();
    const item = document.createElement("div");
    item.className = "history-item";

    item.innerHTML = `
    <h3>${issue.book.title}</h3>
    <p>Student: ${issue.student.name}</p>
    <p>Issue Date: ${new Date(issue.issueDate).toLocaleDateString()}</p>
    <p>Due Date: ${new Date(issue.dueDate).toLocaleDateString()}</p>
    <p>Fine: ₹${fineData.fine}</p>
    <p>Status: <span class="${issue.returnDate ? "available" : "unavailable"}">
        ${issue.returnDate ? "Returned" : "Not Returned"}
    </span></p>
`;

recentIssuesList.appendChild(item);
recentIssuesList.appendChild(item);
}


    const activeIssues = issues.filter(issue => issue.returnDate === null);

    document.getElementById("booksIssued").textContent = activeIssues.length;

    let totalFine = 0;

    for (const issue of issues) {
        const fineResponse = await fetch(`${API_URL}/issues/${issue.id}/fine`);
        const fineData = await fineResponse.json();

        totalFine += fineData.fine;
    }

    document.getElementById("totalFine").textContent = `₹${totalFine}`;

    // ----------------------------------------------Books section------------------------------------------------------------
    const booksList = document.getElementById("booksList");

    booksList.innerHTML = "";

    books.forEach(book => {
        const bookItem = document.createElement("div");

        bookItem.className = "book-item";

        bookItem.innerHTML = `
            <div class="book-info">
                <h3>${book.title}</h3>
                <p>ISBN: ${book.isbn}</p>
            </div>

            <div>
                <span class="${book.availableQuantity > 0 ? "available" : "unavailable"}">
                    ${book.availableQuantity > 0
                        ? `${book.availableQuantity} Available`
                        : "Out of Stock"}
                </span>
            </div>
        `;

        booksList.appendChild(bookItem);
    });

    const studentsList = document.getElementById("studentsList");

studentsList.innerHTML = "";

students.forEach(student => {
    const studentItem = document.createElement("div");

    studentItem.className = "student-item";

    studentItem.innerHTML = `
        <div class="student-info">
            <h3>${student.name}</h3>
            <p>${student.email}</p>
        </div>
    `;

    studentsList.appendChild(studentItem);
});

const studentSelect = document.getElementById("studentId");
studentSelect.innerHTML = '<option value="">Select Student</option>';
students.forEach(student => {
    const option = document.createElement("option");

    option.value = student.id;
    option.textContent = student.name;

    studentSelect.appendChild(option);


    
});
//-------------------------------------------------History Dropdown----------------------------------------------------------
const historyStudent = document.getElementById("historyStudent");
historyStudent.innerHTML = '<option value="">Select Student</option>';
students.forEach(student => {
    const option = document.createElement("option");

    option.value = student.id;
    option.textContent = student.name;

    historyStudent.appendChild(option);
});


// -------------------------------------------------------Book Dropdown-----------------------------------------------------------
const bookSelect = document.getElementById("bookId");
bookSelect.innerHTML = '<option value="">Select Book</option>';
books.forEach(book => {
    if (book.availableQuantity > 0) {
        const option = document.createElement("option");

        option.value = book.id;
        option.textContent = `${book.title} (${book.availableQuantity} available)`;

        bookSelect.appendChild(option);
    }
});

const returnsList = document.getElementById("returnsList");

returnsList.innerHTML = "";

const issuedBooks = issues.filter(issue => issue.returnDate === null);

issuedBooks.forEach(async (issue) => {
    const fineResponse = await fetch(`${API_URL}/issues/${issue.id}/fine`);
    const fineData = await fineResponse.json();
    const returnItem = document.createElement("div");

    returnItem.className = "return-item";

    returnItem.innerHTML = `
        <div class="return-info">
            <h3>${issue.book.title}</h3>
            <p>Student: ${issue.student.name}</p>
            <p>Due Date: ${new Date(issue.dueDate).toLocaleDateString()}</p>
            <p>Fine: ₹${fineData.fine}</p>
        </div>

        <button class="return-btn" onclick="returnBook(${issue.id})">
            Return Book
        </button>
    `;

    returnsList.appendChild(returnItem);
});



}



loadBooks();

document.getElementById("issueForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const studentId = document.getElementById("studentId").value;
    const bookId = document.getElementById("bookId").value;
    const dueDate = document.getElementById("dueDate").value;

    const response = await fetch(`${API_URL}/issues`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            studentId: Number(studentId),
            bookId: Number(bookId),
            dueDate: dueDate
        })
    });

    const data = await response.json();

    if (response.ok) {
        document.getElementById("issueMessage").textContent =
            "Book issued successfully!";

        document.getElementById("issueForm").reset();

        loadBooks();
    } else {
        document.getElementById("issueMessage").textContent =
            data.error || "Failed to issue book.";
    }
});

async function returnBook(issueId) {
    const response = await fetch(`${API_URL}/issues/${issueId}/return`, {
        method: "PUT"
    });

    const data = await response.json();

    if (response.ok) {
        alert("Book returned successfully!");

        loadBooks();
    } else {
        alert(data.error || "Failed to return book.");
    }
}


document.getElementById("historyStudent").addEventListener("change", async (event) => {
    const studentId = event.target.value;
    const historyList = document.getElementById("historyList");

    historyList.innerHTML = "";

    if (!studentId) {
        return;
    }

    const response = await fetch(`${API_URL}/students/${studentId}/issues`);
    const issues = await response.json();

    issues.forEach(async (issue) => {
    const fineResponse = await fetch(`${API_URL}/issues/${issue.id}/fine`);
    const fineData = await fineResponse.json();

    const historyItem = document.createElement("div");

        historyItem.className = "history-item";

        historyItem.innerHTML = `
            <h3>${issue.book.title}</h3>
            <p>Issue Date: ${new Date(issue.issueDate).toLocaleDateString()}</p>
           <p>Due Date: ${new Date(issue.dueDate).toLocaleDateString()}</p>
<p>Fine: ₹${fineData.fine}</p>
<p>Return Date: ${
                issue.returnDate
                    ? new Date(issue.returnDate).toLocaleDateString()
                    : "Not returned"
            }</p>
        `;

        historyList.appendChild(historyItem);
    });
});

const navButtons = document.querySelectorAll(".nav-btn");

navButtons.forEach(button => {
    button.addEventListener("click", () => {
        navButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");
    });
});