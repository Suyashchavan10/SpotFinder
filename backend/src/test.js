const request = require('supertest');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const { expect } = require('chai');
const app = require('../src/index'); // Adjust the path to your index.js file

describe('API Tests', () => {
  it('should return Pong! for /ping', (done) => {
    request(app)
      .get('/ping')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('message', 'Pong!');
        done();
      });
  });

  it('should upload images successfully', (done) => {
    request(app)
      .post('/upload-images')
      .attach('images', path.join(__dirname, 'test-image.jpg')) // Ensure you have a test image in the test directory
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('message', 'Images uploaded successfully!');
        expect(res.body.fileDetails).to.be.an('array');
        done();
      });
  });

  it('should create panorama successfully', (done) => {
    request(app)
      .post('/create-panorama')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('panoramaUrl');
        done();
      });
  });
});