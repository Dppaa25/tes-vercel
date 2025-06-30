require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Variabel untuk menyimpan status koneksi
let isDbConnected = false;

// Fungsi untuk koneksi ke database
const connectDB = async () => {
    if (isDbConnected) return;
    try {
        await mongoose.connect(process.env.MONGO_URI);
        isDbConnected = true;
        console.log("MongoDB connected successfully.");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        isDbConnected = false;
        throw error; // Lemparkan error agar bisa ditangkap
    }
};

// Middleware untuk memastikan koneksi database sebelum setiap request API
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next(); // Lanjutkan ke endpoint jika koneksi berhasil
    } catch (error) {
        res.status(500).json({ message: "Database connection failed", error: error.message });
    }
});


// --- Mongoose Schemas (Struktur Data) ---
const createGenericSchema = (definition) => new mongoose.Schema(definition, { timestamps: true });
const HeroSchema = createGenericSchema({ preTitle: String, name: String, highlight: String, description: String, imageData: String });
const ItemSchema = createGenericSchema({ title: String, description: String, tags: [String], imageData: String });
const EducationSchema = createGenericSchema({ title: String, degree: String, years: String });
const ExperienceSchema = createGenericSchema({ title: String, company: String });
const OrganizationSchema = createGenericSchema({ name: String, role: String });
const ActivitySchema = createGenericSchema({ title: String, description: String });
const SkillSchema = createGenericSchema({ name: String });

// --- Mongoose Models ---
const Hero = mongoose.model('Hero', HeroSchema);
const Portfolio = mongoose.model('Portfolio', ItemSchema);
const Article = mongoose.model('Article', ItemSchema);
const Education = mongoose.model('Education', EducationSchema);
const Experience = mongoose.model('Experience', ExperienceSchema);
const Organization = mongoose.model('Organization', OrganizationSchema);
const Activity = mongoose.model('Activity', ActivitySchema);
const Skill = mongoose.model('Skill', SkillSchema);

// --- API Endpoint Factory ---
function createCrudEndpoints(model) {
    const router = express.Router();
    router.get('/', async (req, res) => { try { const items = await model.find().sort({ createdAt: -1 }); res.json(items); } catch (err) { res.status(500).json({ message: err.message }); } });
    router.post('/', async (req, res) => { const item = new model(req.body); try { const newItem = await item.save(); res.status(201).json(newItem); } catch (err) { res.status(400).json({ message: err.message }); } });
    router.put('/:id', async (req, res) => { try { const updatedItem = await model.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(updatedItem); } catch(err){ res.status(400).json({ message: err.message }); } });
    router.delete('/:id', async (req, res) => { try { const deletedItem = await model.findByIdAndDelete(req.params.id); if (!deletedItem) return res.status(404).json({ message: 'Item tidak ditemukan' }); res.json({ message: 'Item berhasil dihapus' }); } catch (err) { res.status(500).json({ message: err.message }); } });
    return router;
}

// --- Endpoints Spesifik ---
app.get('/api/hero', async (req, res) => { try { const heroData = await Hero.findOne(); res.json(heroData || {}); } catch(err) { res.status(500).json({ message: err.message }) } });
app.post('/api/hero', async (req, res) => { try { const heroData = await Hero.findOneAndUpdate({}, req.body, { new: true, upsert: true }); res.json(heroData); } catch(err) { res.status(400).json({ message: err.message }) } });
app.post('/api/login', (req, res) => { if (req.body.password === process.env.ADMIN_PASSWORD) { res.status(200).json({ success: true, message: 'Login berhasil' }); } else { res.status(401).json({ success: false, message: 'Password salah' }); } });

// --- Daftarkan semua URL API ---
app.use('/api/portfolio', createCrudEndpoints(Portfolio));
app.use('/api/articles', createCrudEndpoints(Article));
app.use('/api/education', createCrudEndpoints(Education));
app.use('/api/experience', createCrudEndpoints(Experience));
app.use('/api/organization', createCrudEndpoints(Organization));
app.use('/api/activity', createCrudEndpoints(Activity));
app.use('/api/skills', createCrudEndpoints(Skill));

module.exports = app;
