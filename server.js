const express = require('express')
const mongoose = require("mongoose");
const inputDataModel = require("./model/model")
const multer = require("multer")
const excelToJson = require("convert-excel-to-json")
const nodemailer = require('nodemailer')
// const fs = require("fs-extra")
const app = express()
const ejs = require('ejs')

require("dotenv").config();

const api2pdf = require('api2pdf');
const api2pdfapikey = process.env.KEY;
const a2pClient = new api2pdf(api2pdfapikey);

var upload = multer({ dest: "uploads/" })

app.set("view engine", "ejs")
app.use(express.static("./public"))
app.use(express.json())

const generateCertificate = async (user) => {

    const pdfFileName = `certificate_${user.Name.replace(/\s+/g, '_')}.pdf`;
    const htmlContent = await ejs.renderFile('index.ejs', { Name: user.Name, Amount: user.Amount });

    const pdfOptions = {
        inline: false,
        filename: pdfFileName,
        orientation: "landscape",
    };

    try {
        const result = await a2pClient.wkHtmlToPdf(htmlContent, pdfOptions);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.USER,
                pass: process.env.APP_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.USER,
            to: user.Email,
            subject: '🌳 Your Tree-tastic Certification Has Arrived! 🌿',
            text: 
            `Dear ${user.Name},\n\nHeartfelt gratitude for your generous contribution to our tree-planting initiative. Your support is a beacon for a greener, healthier Earth. Each rupee sown echoes a commitment to a sustainable future. Your ${user.Amount} donation for planting  trees is a monumental contribution to our green revolution.\n\nSincerely,\nNikhil Rawat`,
            attachments: [{
                filename: pdfFileName,
                path: result.FileUrl,
                contentType: 'application/pdf',
            }],
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        console.log(user);
    } catch (err) {
        console.log(err);
    }
};


app.post('/read', upload.single('file'), async (req, res) => {

    try {

        if (req.file.filename == null || req.file.filename == "undefined") {
            res.status(400).json('no file')
        }
        else {

            let filepath = 'uploads/' + req.file.filename

            const excelData = excelToJson({
                sourceFile: filepath,
                header: {
                    rows: 1
                },
                columnToKey: {
                    "*": "{{columnHeader}}"
                }
            })

            // fs.remove(filepath)

            const jsonData = excelData.Sheet1;

            await inputDataModel.insertMany(jsonData)

            for (const user of jsonData) {
                await generateCertificate(user);
            }

            res.status(200).json(excelData)
        }
    }
    catch (error) {
        res.status(500).send("Internal Error0")
    }
})

mongoose.connect("mongodb://127.0.0.1:27017/excelToJson")
    .then((result) => {
        console.log("Server connected to database ")
    }).catch((err) => {
        console.log("Server failed ")
    })

// app.get('/', function (req, res) {
//   res.render('index.ejs')
// })

app.listen(3000, function (req, res) {
    console.log("Hello world");
})

