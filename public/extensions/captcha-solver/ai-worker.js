// AI Worker for CAPTCHA Processing
// This file handles background AI processing tasks

(function() {
  'use strict';

  // AI processing queue
  const processingQueue = [];
  let isProcessing = false;

  // Process image with AI
  async function processWithAI(imageBase64, captchaType) {
    try {
      // Call the backend API for AI processing
      const response = await fetch('https://yygquhqavbandcqkzzcn.supabase.co/functions/v1/solve-captcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          captchaType
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('[AI Worker] Processing error:', error);
      return { success: false, error: error.message };
    }
  }

  // Add task to queue
  function queueTask(task) {
    return new Promise((resolve) => {
      processingQueue.push({ task, resolve });
      processNext();
    });
  }

  // Process next task in queue
  async function processNext() {
    if (isProcessing || processingQueue.length === 0) {
      return;
    }

    isProcessing = true;
    const { task, resolve } = processingQueue.shift();

    try {
      const result = await processWithAI(task.imageBase64, task.captchaType);
      resolve(result);
    } catch (error) {
      resolve({ success: false, error: error.message });
    }

    isProcessing = false;
    processNext();
  }

  // Image preprocessing for better AI recognition
  function preprocessImage(imageBase64) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Resize to optimal size
        const maxSize = 512;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Apply preprocessing
        ctx.filter = 'contrast(1.2) brightness(1.1)';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert back to base64
        const processed = canvas.toDataURL('image/png').split(',')[1];
        resolve(processed);
      };
      
      img.onerror = () => resolve(imageBase64);
      img.src = 'data:image/png;base64,' + imageBase64;
    });
  }

  // Expose worker functions
  self.__BHD_AI_WORKER__ = {
    process: processWithAI,
    queue: queueTask,
    preprocess: preprocessImage
  };

  console.log('[AI Worker] BHD AI Worker initialized');
})();
