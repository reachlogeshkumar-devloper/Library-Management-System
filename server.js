import "dotenv/config";
import express from "express";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const app = express();


app.use(express.static("frontend"));  



const dbUrl = new URL(process.env.DATABASE_URL);

const adapter = new PrismaMariaDb({
    host: dbUrl.hostname,
    port: Number(dbUrl.port || 3306),
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.slice(1),
});

const prisma = new PrismaClient({ adapter });

app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/frontend/index.html");
});



app.get("/books", async (req, res) => {                 //----------Get/book---------
        const book = await prisma.book.findMany({
            include: {
        author: true
        }});
        res.json(book);
    });

app.get("/books/:id", async (req, res) => {            //------------GEt/books/Id
  const book = await prisma.book.findUnique({
    where: {
      id: Number(req.params.id)
    }
  });

  res.json(book);
});    

    app.get("/authors", async (req, res) => {                 //----------Get/authors---------
        const authors = await prisma.author.findMany({
            include: {
        books: true
        }});
        res.json(authors);
    });


app.get("/authors/:id", async (req, res) => {           //----------Get/authors/Id---------
    const id = Number(req.params.id);                   // Number is used to covert the string id to number 
    const author = await prisma.author.findUnique({   
    where:{
        id:id
    }  
    });
    if (author===null) {
   return res.status(404).json({
        message: "Author not found"
    });
    
}
res.json(author);
});

app.get("/students", async (req, res) => {                 //----------Get/students---------
        const student = await prisma.student.findMany();
        res.json(student);
    });

app.get("/students/:id", async (req, res) => {
  const student = await prisma.student.findUnique({
    where: {
      id: Number(req.params.id)
    }
  });

  res.json(student);
});

app.get("/issues", async (req, res) => {
    const issues = await prisma.issue.findMany({
        include: {
            student: true,
            book: true
        }
    });

    res.json(issues);
});




app.get("/issues/:id/fine", async (req, res) => {                              //------------Get/issues/Id/Fine
  try {
    const issue = await prisma.issue.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

  if (!issue) {
    return res.status(404).json({
      message: "Issue not found"
    });
  }

  const endDate = issue.returnDate || new Date();

  const difference = endDate - issue.dueDate;

  const lateDays = Math.max(
    0,
    Math.ceil(difference / (1000 * 60 * 60 * 24))
  );

  const fine = lateDays * 10;

 
    res.json({
      issueId: issue.id,
      lateDays: lateDays,
      fine: fine
    });

  } catch (error) {
    console.error("Fine calculation error:", error);

    res.status(500).json({
      error: "Failed to calculate fine"
    });
  }
});


app.get("/students/:id/issues", async (req, res) => {   //-------------Get/students/Id/issues
  const issues = await prisma.issue.findMany({
    where: {
      studentId: Number(req.params.id)
    },
    include: {
      book: true
    }
  });

  res.json(issues);
});

app.post("/books", async (req, res) => {                  //----------post/books---------
    const book = await prisma.book.create({
      data: {
    title: req.body.title,
    isbn: req.body.isbn,
    quantity: req.body.quantity,
    availableQuantity: req.body.quantity,
    authorId: req.body.authorId
}
    });

    res.json(book);
});

app.post("/authors", async (req, res) => {                   //----------post/authors---------
    try{
    const author = await prisma.author.create({
        data: {
            name: req.body.name
        }
    });
    res.json(author);
}

catch(error){
res.status(500).json(
    {
        "message": "Something went wrong"
    }
)
}
    
});

app.post("/issues", async (req, res) => {                   //-------------Post/Issues
  const book = await prisma.book.findUnique({
    where: {
      id: req.body.bookId
    }
  });

  if (!book) {
    return res.status(404).json({
      message: "Book not found"
    });
  }

  if (book.availableQuantity <= 0) {
    return res.status(400).json({
      message: "Book is not available"
    });
  }

  const issue = await prisma.issue.create({
    data: {
      studentId: req.body.studentId,
      bookId: req.body.bookId,
      dueDate: new Date(req.body.dueDate)
    }
  });

  await prisma.book.update({
    where: {
      id: req.body.bookId
    },
    data: {
      availableQuantity: {
        decrement: 1
      }
    }
  });

  res.json(issue);
});


app.put("/books/:id", async (req, res) => {                   //----------put/books/Id---------
    const id = Number(req.params.id);

    const book = await prisma.book.update({
        where: {
            id: id
        },
        data: {
            title: req.body.title,
            isbn: req.body.isbn
        }
    });

    res.json(book);
});

app.put("/books/:id/stock", async (req, res) => {              //--------Put/books/Id/stock-----------
  const book = await prisma.book.update({
    where: {
      id: Number(req.params.id)
    },
    data: {
      quantity: req.body.quantity,
      availableQuantity: req.body.availableQuantity
    }
  });

  res.json(book);
});

app.put("/authors/:id", async (req, res) => {                 //------------put author  || Update author------------
    const id = Number(req.params.id);
    try{
    const author = await prisma.author.update({
        where:{
            id : id
        },
        data:{
           name : req.body.name
        }
    
    });
    res.json(author)
    }

    catch(error){  
    if(error.code==="P2025"){    
        res.status(404).json({
            "message": "Author not found"
        });
        console.log(error.message);
        console.log(error.code);
        
    }}

});

app.put("/students/:id", async (req, res) => {                                //---------------Put/Students/Id----------------------
  try {
    const student = await prisma.student.update({
      where: {
        id: Number(req.params.id)
      },
      data: {
        name: req.body.name,
        email: req.body.email

      }
    });

    res.json(student);
  } catch (error) {
    res.status(500).json({
      error: "Failed to update student"
    });
  }
});


app.put("/issues/:id/return", async (req, res) => {                   //----------put/Issue/Id/return---------
       const issue = await prisma.issue.update({
        where: {
            id: Number(req.params.id)
        },
        data: {
           returnDate: new Date()
        }
    });
  await prisma.book.update({
    where: {
      id: issue.bookId
    },
    data: {
      availableQuantity: {
        increment: 1
      }
    }
  });
    res.json(issue);
});



app.delete("/books/:id", async (req, res) => {                   //----------delete/books---------
    const id = Number(req.params.id);

    await prisma.book.delete({
        where: {
            id: id
        }
    });

    res.send("Book deleted");
});

app.delete("/issues/:id", async (req, res) => {                //----------delete/issues/Id---------
  const issue = await prisma.issue.delete({
    where: {
      id: Number(req.params.id)
    }
  });

  res.json(issue);
});












app.listen(3000, () => {
    console.log("Server running on port 3000");
});