# 🎥 Media Fetcher

A simple full-stack web app that allows users to fetch and download publicly available video content using a video URL.

> ⚠️ This tool is intended for **educational purposes only**. Always respect the Terms of Service of any platform you use.

---

## 🛠 Built With

### ✅ Backend

- **FastAPI** (Python)
- **yt-dlp** for media extraction
- **Pydantic** for data validation

### ✅ Frontend

- **Next.js** (TypeScript)
- **Tailwind CSS**
- **Axios** for API communication
- **React Hook Form** for form handling

---

## 🚀 Getting Started

Clone the repo and set up the backend and frontend:

```bash
# Clone the repo
git clone https://github.com/FestimReqi/media-fetcher_
cd media-fetcher_

# ---------- Backend Setup ----------
cd backend
python -m venv venv
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload &  # Runs backend in background
cd ..

# ---------- Frontend Setup ----------
cd frontend
npm install
npm run dev
```

Open your browser and go to http://localhost:3000 to test the app.

---

## 📦 Features

- 🔗 [Live Demo](https://mediafetchfr.netlify.app/)
- 🎥 Extract video metadata and download link using `yt-dlp`
- ⚡ Fast, responsive UI with Next.js + Tailwind
- ❌ Graceful error handling and validation

---

## 📁 Folder Structure

```
media-fetcher_/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── pages/
│   ├── components/
│   └── ...
```

---

## 💡 License

This project is licensed under the [MIT License](https://github.com/FestimReqi/media-fetcher_/blob/main/LICENSE).

---

## 🔗 Connect with Me

[![GitHub FestimReqi](https://img.shields.io/badge/GitHub-FestimReqi-181717?style=flat&logo=github)](https://github.com/FestimReqi)  
[![Facebook festim00](https://img.shields.io/badge/Facebook-festim00-1877F2?style=flat&logo=facebook)](https://www.facebook.com/festim00/)  
[![Instagram @festim.reqi15](https://img.shields.io/badge/Instagram-festim.reqi15-e4405f?style=flat&logo=instagram)](https://www.instagram.com/festim.reqi15/)  
[![Behance festimchannel](https://img.shields.io/badge/Behance-festimchannel-1769ff?style=flat&logo=behance)](https://www.behance.net/festimchannel)  
[![LinkedIn Festim Reçi](https://img.shields.io/badge/LinkedIn-Festim_Reçi-blue?style=flat&logo=linkedin)](https://www.linkedin.com/in/festimre%C3%A7i/)
