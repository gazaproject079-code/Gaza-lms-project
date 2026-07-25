const React = require('react');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { cloudinary } = require('../config/cloudinary');

// Try to load @react-pdf/renderer, fallback if ES Module issue
let Document, Page, Text, View, Image, StyleSheet, renderToBuffer;
let pdfAvailable = true;
try {
  const reactPdf = require('@react-pdf/renderer');
  Document = reactPdf.Document;
  Page = reactPdf.Page;
  Text = reactPdf.Text;
  View = reactPdf.View;
  Image = reactPdf.Image;
  StyleSheet = reactPdf.StyleSheet;
  renderToBuffer = reactPdf.renderToBuffer;
} catch (error) {
  console.warn('⚠️  @react-pdf/renderer not available. Certificate generation will be disabled.');
  console.warn('   This is expected during initial deployment. Certificates can be enabled later.');
  pdfAvailable = false;
}

// Try to load sharp for image analysis, fallback to manual if not available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not installed, using fallback image analysis');
  sharp = null;
}

// Logo path - automatically used for all certificates
const LOGO_PATH = path.join(__dirname, '../assets/gazarise_logo.png');

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

/**
 * Calculate relative luminance of a color
 * Returns value between 0 (darkest) and 1 (lightest)
 */
const getLuminance = (hex) => {
  const rgb = hexToRgb(hex);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Determine if a color is light or dark
 */
const isLightColor = (hex) => {
  return getLuminance(hex) > 0.5;
};

/**
 * Get contrasting text color (black or white) for a background
 */
const getContrastColor = (bgColor, lightColor = '#FFFFFF', darkColor = '#333333') => {
  return isLightColor(bgColor) ? darkColor : lightColor;
};

/**
 * Analyze image brightness to determine if it's light or dark
 * Returns: 'light', 'dark', or null if unable to analyze
 */
const analyzeImageBrightness = async (imagePath) => {
  try {
    if (!imagePath) return null;

    if (!sharp) {
      console.log('analyzeImageBrightness: Sharp not available, defaulting to dark');
      return 'dark';
    }

    let imageInput;

    // Handle HTTP URLs (Cloudinary or remote images)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      console.log('analyzeImageBrightness: Downloading from URL:', imagePath);
      const https = require('https');
      const http = require('http');
      const client = imagePath.startsWith('https') ? https : http;
      imageInput = await new Promise((resolve, reject) => {
        client.get(imagePath, (res) => {
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        }).on('error', reject);
      });
    } else {
      // Local file path
      let fullPath = imagePath;
      if (imagePath.startsWith('/uploads/') || imagePath.startsWith('\\uploads\\')) {
        const relativePath = imagePath.replace(/^[/\\]/, '').replace(/\//g, path.sep);
        fullPath = path.join(__dirname, '..', relativePath);
      } else if (!path.isAbsolute(imagePath)) {
        fullPath = path.join(__dirname, '..', imagePath);
      }
      fullPath = path.normalize(fullPath);

      if (!fs.existsSync(fullPath)) {
        console.log('analyzeImageBrightness: File not found:', fullPath);
        return null;
      }
      imageInput = fullPath;
    }

    const image = sharp(imageInput);
    const stats = await image.stats();

    // Calculate average brightness from RGB channels
    const avgBrightness = (stats.channels[0].mean + stats.channels[1].mean + stats.channels[2].mean) / 3;

    // Normalize to 0-1 range (values are 0-255)
    const normalizedBrightness = avgBrightness / 255;

    console.log(`analyzeImageBrightness: Average brightness = ${normalizedBrightness.toFixed(2)}`);

    // Threshold: below 0.5 is dark, above is light
    return normalizedBrightness > 0.5 ? 'light' : 'dark';
  } catch (error) {
    console.error('analyzeImageBrightness: Error analyzing image:', error.message);
    return null;
  }
};

/**
 * Create PDF styles - optimized for single landscape A4 page
 * Automatically adjusts text colors based on background image brightness
 * @param {Object} template - Template settings
 * @param {string} backgroundBrightness - 'light', 'dark', or null (no background)
 */
const createStyles = (template, backgroundBrightness = null) => {
  const primaryColor = template?.primaryColor || '#4F46E5';
  const secondaryColor = template?.secondaryColor || '#22D3EE';

  // Determine text colors based on actual background image brightness
  // Dark background = light text, Light background = dark text
  const isDarkBackground = backgroundBrightness === 'dark';
  const hasBackgroundImage = backgroundBrightness !== null;

  // Text colors - automatically adjust based on background brightness
  let titleColor, studentNameColor, brandColor;
  let subtitleColor, bodyTextColor, courseNameColor;
  let detailTextColor, footerTextColor, signatureLineColor, signatureTitleColor;
  let borderColor, innerBorderColor, watermarkColor;

  if (hasBackgroundImage) {
    if (isDarkBackground) {
      // Dark background - use light/white text
      titleColor = '#FFFFFF';
      studentNameColor = '#FFFFFF';
      brandColor = '#FFFFFF';
      subtitleColor = '#E0E0E0';
      bodyTextColor = '#E0E0E0';
      courseNameColor = '#FFFFFF';
      detailTextColor = '#CCCCCC';
      footerTextColor = '#AAAAAA';
      signatureLineColor = '#FFFFFF';
      signatureTitleColor = '#CCCCCC';
      borderColor = secondaryColor;
      innerBorderColor = 'rgba(255, 255, 255, 0.3)';
      watermarkColor = 'rgba(255, 255, 255, 0.05)';
    } else {
      // Light background - use dark/black text
      titleColor = '#1a1a1a';
      studentNameColor = '#1a1a1a';
      brandColor = '#1a1a1a';
      subtitleColor = '#444444';
      bodyTextColor = '#444444';
      courseNameColor = '#1a1a1a';
      detailTextColor = '#666666';
      footerTextColor = '#777777';
      signatureLineColor = '#333333';
      signatureTitleColor = '#666666';
      borderColor = primaryColor;
      innerBorderColor = secondaryColor;
      watermarkColor = 'rgba(0, 0, 0, 0.03)';
    }
  } else {
    // No background image - white background, use original colors
    titleColor = primaryColor;
    studentNameColor = primaryColor;
    brandColor = primaryColor;
    subtitleColor = '#666666';
    bodyTextColor = '#666666';
    courseNameColor = '#333333';
    detailTextColor = '#888888';
    footerTextColor = '#999999';
    signatureLineColor = '#333333';
    signatureTitleColor = '#888888';
    borderColor = primaryColor;
    innerBorderColor = secondaryColor;
    watermarkColor = 'rgba(79, 70, 229, 0.03)';
  }

  return StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      padding: 0,
      position: 'relative',
      width: '100%',
      height: '100%',
    },
    backgroundImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    border: {
      position: 'absolute',
      top: 15,
      left: 15,
      right: 15,
      bottom: 15,
      borderWidth: 3,
      borderColor: borderColor,
      borderRadius: 8,
    },
    innerBorder: {
      position: 'absolute',
      top: 22,
      left: 22,
      right: 22,
      bottom: 22,
      borderWidth: 1,
      borderColor: innerBorderColor,
      borderRadius: 4,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 30,
      paddingTop: 25,
      paddingBottom: 40,
    },
    logo: {
      width: 55,
      height: 55,
      marginBottom: 6,
      borderRadius: 8,
    },
    brandName: {
      fontSize: 11,
      fontWeight: 'bold',
      color: brandColor,
      letterSpacing: 2,
      marginBottom: 12,
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      color: titleColor,
      textTransform: 'uppercase',
      letterSpacing: 3,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 10,
      color: subtitleColor,
      marginBottom: 14,
      letterSpacing: 1,
    },
    studentName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: studentNameColor,
      marginBottom: 8,
      paddingBottom: 6,
      borderBottomWidth: 2,
      borderBottomColor: secondaryColor,
      minWidth: 200,
      textAlign: 'center',
    },
    completionText: {
      fontSize: 10,
      color: bodyTextColor,
      marginBottom: 6,
    },
    courseName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: courseNameColor,
      marginBottom: 16,
      textAlign: 'center',
      maxWidth: 380,
    },
    detailsContainer: {
      marginBottom: 16,
      alignItems: 'center',
    },
    detailText: {
      fontSize: 9,
      color: detailTextColor,
      marginBottom: 3,
    },
    signatureSection: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'flex-end',
      marginTop: 10,
    },
    signatureBlock: {
      alignItems: 'center',
      minWidth: 140,
    },
    signatureImage: {
      width: 100,
      height: 40,
      marginBottom: 4,
      objectFit: 'contain',
    },
    signatureLine: {
      width: 120,
      borderTopWidth: 1,
      borderTopColor: signatureLineColor,
      paddingTop: 4,
      fontSize: 9,
      color: bodyTextColor,
      textAlign: 'center',
    },
    signatureTitle: {
      fontSize: 7,
      color: signatureTitleColor,
      marginTop: 2,
    },
    footer: {
      position: 'absolute',
      bottom: 28,
      left: 40,
      right: 40,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    footerText: {
      fontSize: 7,
      color: footerTextColor,
    },
    watermark: {
      position: 'absolute',
      top: '42%',
      left: '18%',
      transform: 'rotate(-30deg)',
      fontSize: 60,
      color: watermarkColor,
      fontWeight: 'bold',
      letterSpacing: 12,
    },
  });
};

/**
 * Certificate Document Component - Single landscape A4 page
 */
const CertificateDocument = ({ data, template, backgroundBrightness }) => {
  // Pass background brightness to adjust text colors automatically
  const styles = createStyles(template, backgroundBrightness);
  const titleText = template?.titleText || 'Certificate of Completion';
  const subtitleText = template?.subtitleText || 'This is to certify that';

  // Format the issue date
  const issueDate = new Date(data.issueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const pageContent = [];

  // Background image (if available)
  if (data.backgroundImage) {
    pageContent.push(
      React.createElement(Image, { key: 'bg', style: styles.backgroundImage, src: data.backgroundImage })
    );
  }

  // Border decorations
  pageContent.push(React.createElement(View, { key: 'border', style: styles.border }));
  pageContent.push(React.createElement(View, { key: 'innerBorder', style: styles.innerBorder }));

  // Watermark
  pageContent.push(React.createElement(Text, { key: 'watermark', style: styles.watermark }, 'GAZARISE'));

  // Main content
  const contentChildren = [];

  // Logo
  if (data.logoPath) {
    contentChildren.push(React.createElement(Image, { key: 'logo', style: styles.logo, src: data.logoPath }));
  }

  // Brand name
  contentChildren.push(React.createElement(Text, { key: 'brand', style: styles.brandName }, 'GAZARISE'));

  // Title
  contentChildren.push(React.createElement(Text, { key: 'title', style: styles.title }, titleText));

  // Subtitle
  contentChildren.push(React.createElement(Text, { key: 'subtitle', style: styles.subtitle }, subtitleText));

  // Student name
  contentChildren.push(React.createElement(Text, { key: 'student', style: styles.studentName }, data.studentName));

  // Completion text
  contentChildren.push(React.createElement(Text, { key: 'completion', style: styles.completionText }, 'has successfully completed the course'));

  // Course name
  contentChildren.push(React.createElement(Text, { key: 'course', style: styles.courseName }, data.courseName));

  // Details
  contentChildren.push(
    React.createElement(View, { key: 'details', style: styles.detailsContainer },
      React.createElement(Text, { style: styles.detailText }, `Issued on: ${issueDate}`),
      React.createElement(Text, { style: styles.detailText }, `Certificate ID: ${data.certificateNumber}`)
    )
  );

  // Signature section
  const signatureChildren = [];
  if (data.adminSignature) {
    signatureChildren.push(React.createElement(Image, { key: 'sig', style: styles.signatureImage, src: data.adminSignature }));
  }
  signatureChildren.push(React.createElement(Text, { key: 'sigLine', style: styles.signatureLine }, 'Administrator'));
  signatureChildren.push(React.createElement(Text, { key: 'sigTitle', style: styles.signatureTitle }, 'GazaRise'));

  contentChildren.push(
    React.createElement(View, { key: 'sigSection', style: styles.signatureSection },
      React.createElement(View, { style: styles.signatureBlock }, ...signatureChildren)
    )
  );

  pageContent.push(React.createElement(View, { key: 'content', style: styles.content }, ...contentChildren));

  // Footer
  pageContent.push(
    React.createElement(View, { key: 'footer', style: styles.footer },
      React.createElement(Text, { style: styles.footerText }, `Verify at: gazarise.com/verify/${data.certificateNumber}`),
      React.createElement(Text, { style: styles.footerText }, data.certificateNumber)
    )
  );

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', orientation: 'landscape', style: styles.page, wrap: false },
      ...pageContent
    )
  );
};

/**
 * Convert file path to base64 data URI for images
 * @react-pdf/renderer works best with base64 encoded images
 */
const getImageSource = (imagePath) => {
  try {
    if (!imagePath) {
      console.log('getImageSource: No image path provided');
      return null;
    }

    console.log('getImageSource: Processing path:', imagePath);

    // If it's already a data URI, return as is
    if (imagePath.startsWith('data:')) {
      return imagePath;
    }

    // If it's an HTTP URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    let fullPath;

    // If it's a relative URL path (starts with /uploads/...)
    if (imagePath.startsWith('/uploads/') || imagePath.startsWith('\\uploads\\')) {
      // Remove leading slash and normalize path separators
      const relativePath = imagePath.replace(/^[/\\]/, '').replace(/\//g, path.sep);
      fullPath = path.join(__dirname, '..', relativePath);
    }
    // If it's already an absolute path
    else if (path.isAbsolute(imagePath)) {
      fullPath = imagePath;
    }
    // If it's a relative file path
    else {
      fullPath = path.join(__dirname, '..', imagePath);
    }

    // Normalize the path for the current OS
    fullPath = path.normalize(fullPath);

    console.log('getImageSource: Checking file:', fullPath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.warn(`getImageSource: Image not found at: ${fullPath}`);
      return null;
    }

    // Read file and convert to base64 data URI
    const fileBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    let mimeType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';

    const base64 = fileBuffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64}`;

    console.log(`getImageSource: SUCCESS - Converted ${fullPath} to base64 (${mimeType})`);
    return dataUri;
  } catch (error) {
    console.error('getImageSource: Error processing image:', error);
    return null;
  }
};

/**
 * Generate PDF certificate from data
 * @param {Object} data - Certificate data { studentName, courseName, certificateNumber, issueDate }
 * @param {Object} template - Template settings from database
 * @returns {Buffer} PDF buffer
 */
const generateCertificatePDF = async (data, template = null) => {
  // Check if PDF generation is available
  if (!pdfAvailable) {
    throw new Error('Certificate generation is temporarily unavailable. Please contact administrator.');
  }

  try {
    // Get logo source
    const logoPath = getImageSource(LOGO_PATH);
    console.log('Logo path:', logoPath);

    // Get admin signature if available
    let adminSignature = null;
    if (template?.adminSignature) {
      adminSignature = getImageSource(template.adminSignature);
      console.log('Admin signature path:', adminSignature);
    }

    // Get background image if available and analyze its brightness
    let backgroundImage = null;
    let backgroundBrightness = null;
    if (template?.backgroundImage) {
      backgroundImage = getImageSource(template.backgroundImage);
      console.log('Background image path:', backgroundImage);

      // Analyze background image brightness for automatic text color adjustment
      backgroundBrightness = await analyzeImageBrightness(template.backgroundImage);
      console.log('Background brightness:', backgroundBrightness);
    }

    // Prepare certificate data
    const certificateData = {
      ...data,
      logoPath,
      adminSignature,
      backgroundImage
    };

    console.log('Generating certificate with data:', {
      studentName: certificateData.studentName,
      courseName: certificateData.courseName,
      hasLogo: !!certificateData.logoPath,
      hasSignature: !!certificateData.adminSignature,
      hasBackground: !!certificateData.backgroundImage,
      backgroundBrightness
    });

    // Generate PDF buffer using React PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(CertificateDocument, { data: certificateData, template, backgroundBrightness })
    );

    return pdfBuffer;
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    throw error;
  }
};

/**
 * Save PDF to storage and return URL
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {string} certificateNumber - Unique certificate number
 * @returns {string} File URL/path (Local path or Cloudinary URL)
 */
const saveCertificatePDF = async (pdfBuffer, certificateNumber) => {
  try {
    const filename = `Certificate_${certificateNumber}.pdf`;

    // Save to local uploads folder
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'certificates');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);

    // Write PDF buffer to file
    fs.writeFileSync(filePath, pdfBuffer);

    console.log('Certificate saved locally:', filePath);

    // Return local URL path
    const localUrl = `/uploads/certificates/${filename}`;
    return localUrl;
  } catch (error) {
    console.error('Error saving certificate PDF:', error);
    throw error;
  }
};

/**
 * Generate unique certificate number
 * @param {number} userId - User ID
 * @param {number} courseId - Course ID
 * @returns {string} Unique certificate number
 */
const generateCertificateNumber = (userId, courseId) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CERT-${userId}-${courseId}-${timestamp}-${random}`;
};

/**
 * Generate and save certificate
 * @param {Object} data - { studentName, courseName, certificateNumber, issueDate }
 * @param {Object} template - Template settings
 * @returns {Object} { pdfBuffer, certificateUrl }
 */
const generateAndSaveCertificate = async (data, template = null) => {
  try {
    // Generate PDF
    const pdfBuffer = await generateCertificatePDF(data, template);

    // Save PDF to storage
    const certificateUrl = await saveCertificatePDF(pdfBuffer, data.certificateNumber);

    return {
      pdfBuffer,
      certificateUrl
    };
  } catch (error) {
    console.error('Error generating and saving certificate:', error);
    throw error;
  }
};

module.exports = {
  generateCertificatePDF,
  saveCertificatePDF,
  generateCertificateNumber,
  generateAndSaveCertificate,
  getImageSource,
  CertificateDocument
};
