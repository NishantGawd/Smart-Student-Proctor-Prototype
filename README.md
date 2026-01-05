# SmartSession Prototype

## Overview
This is a real-time student monitoring system built for the "SmartSession" challenge. The goal was to create a "Super Vision" tool for teachers that can detect when a student is confused, focused, or looking away, without using invasive or heavy AI models.

The system is split into two parts: a **Student Portal** (React) that captures video, and a **Backend** (FastAPI) that processes the video feed to extract insights.

## Features
* **Real-Time Analysis:** Uses WebSockets to process video frames instantly.
* **Proctoring:** Detects if the student looks away (Up, Down, Left, Right) for more than 4 seconds.
* **Engagement Detection:**
    * **Focused:** Default state.
    * **Happy/Excited:** Detects smiles.
    * **Confused:** Custom logic using eyebrow furrowing and head tilt.
* **Live Dashboard:** A merged view where you can see the student feed, current status, and a live engagement graph.

## Tech Stack
* **Frontend:** React (Vite)
* **Backend:** Python (FastAPI)
* **AI/CV:** MediaPipe (Face Mesh), OpenCV
* **Communication:** Native WebSockets

---

## How to Run

### 1. Backend Setup (Python)
Navigate to the `backend` folder and set up the Python environment.

```bash
# 1. Navigate to backend
cd backend

# 2. Create a virtual environment (Recommended)
python -m venv venv

# 3. Activate the virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r ../requirements.txt

# 5. Run the server
uvicorn main:app --reload