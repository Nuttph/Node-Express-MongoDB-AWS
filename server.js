const express = require('express');
const mongoose = require('mongoose')
const cors = require('cors')
const app = express();
const port = 3000;
require('dotenv').config();
app.use(express.json());
app.use(cors());

// สร้าง Schema สำหรับ User
const userSchema = new mongoose.Schema({
    author: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// สร้าง Model
const Library = mongoose.model('Library', userSchema);

// POST route สำหรับสร้าง user ใหม่
app.post('/library', async (req, res) => {
    try {
        // ดึงข้อมูลจาก request body
        const { author, description } = req.body;

        // ตรวจสอบว่ามีข้อมูลครบหรือไม่
        if (!author || !description) {
            return res.status(400).json({ 
                message: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
            });
        }

        // สร้าง user ใหม่
        const newAuthor = new Library({
            author,
            description,
             // ใน production ควร hash password ก่อนบันทึก
        });

        // บันทึก user ลง database
        const savedAuthor = await newAuthor.save();

        // ส่ง response กลับ
        res.status(201).json({
            message: 'Created Author',
            user: {
                id: savedAuthor._id,
                author: savedAuthor.author,
                description: savedAuthor.description,
                createdAt: savedAuthor.createdAt
            }
        });

    } catch (error) {
        // กรณีเกิด error (เช่น email หรือ username ซ้ำ)
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'username หรือ email นี้มีอยู่ในระบบแล้ว' 
            });
        }
        
        res.status(500).json({ 
            message: 'เกิดข้อผิดพลาดในการสร้าง user',
            error: error.message 
        });
    }
});

app.get('/library',async(req,res)=>{
    const libraryItems = await Library.find();

        // ถ้าไม่มีข้อมูล
        if (libraryItems.length === 0) {
            return res.status(200).json({
                message: 'ยังไม่มีข้อมูลในห้องสมุด',
                data: []
            });
        }

        // ส่งข้อมูลทั้งหมดกลับไป
        res.status(200).json({
            message: 'ดึงข้อมูลห้องสมุดสำเร็จ',
            total: libraryItems.length,
            data: libraryItems
        });
})

app.get('/library/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // ตรวจสอบว่า ID ถูกต้อง
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID ไม่ถูกต้อง' });
        }

        const obj = await Library.findById(id);
        if (!obj) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลสำหรับ ID นี้' });
        }

        res.status(200).json(obj);
    } catch (error) {
        res.status(500).json({
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
            error: error.message
        });
    }
});

// PUT - อัพเดทข้อมูล Library item โดย ID
app.put('/library/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // ตรวจสอบว่า ID ถูกต้อง
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID ไม่ถูกต้อง' });
        }

        const updatedObj = await Library.findByIdAndUpdate(
            id,
            req.body, // รับข้อมูลจาก request body
            { 
                new: true, // คืนข้อมูลที่อัพเดทแล้ว
                runValidators: true // ตรวจสอบ validation
            }
        );

        if (!updatedObj) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลสำหรับ ID นี้' });
        }

        res.status(200).json({
            message: 'อัพเดทข้อมูลสำเร็จ',
            data: updatedObj
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'ข้อมูลซ้ำ (เช่น ISBN)' });
        }
        res.status(500).json({
            message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล',
            error: error.message
        });
    }
});

// DELETE - ลบข้อมูล Library item โดย ID
app.delete('/library/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // ตรวจสอบว่า ID ถูกต้อง
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID ไม่ถูกต้อง' });
        }

        const deletedObj = await Library.findByIdAndDelete(id);

        if (!deletedObj) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลสำหรับ ID นี้' });
        }

        res.status(200).json({
            message: 'ลบข้อมูลสำเร็จ',
            data: deletedObj
        });
    } catch (error) {
        res.status(500).json({
            message: 'เกิดข้อผิดพลาดในการลบข้อมูล',
            error: error.message
        });
    }
});

app.listen(port,()=>{
    console.log("server is running at http://localhost:3000")
})

mongoose.connect(process.env.SECRETE)
  .then(() => console.log('Connected!')).catch(()=>{
    console.log("Connection failed!")
  });