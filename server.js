const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const DATA_FILE = "./tasks.json";

function readTasks() {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data);
}

function writeTasks(tasks) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

app.get("/api/tasks", (req, res) => {
    res.json(readTasks());
});

app.post("/api/tasks", (req, res) => {
    const tasks = readTasks();

    const newTask = {
        id: Date.now(),
        text: req.body.text,
        completed: false
    };

    tasks.push(newTask);

    writeTasks(tasks);

    res.status(201).json(newTask);
});

app.put("/api/tasks/:id", (req, res) => {
    const tasks = readTasks();

    const task = tasks.find(
        t => t.id == req.params.id
    );

    if (!task) {
        return res.status(404).json({
            message: "Task not found"
        });
    }

    task.completed = !task.completed;

    writeTasks(tasks);

    res.json(task);
});

app.delete("/api/tasks/:id", (req, res) => {
    const tasks = readTasks();

    const updatedTasks = tasks.filter(
        t => t.id != req.params.id
    );

    writeTasks(updatedTasks);

    res.json({
        message: "Task deleted"
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});