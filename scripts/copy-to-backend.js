// srcipts/copy-to-backend.js
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

/**
 * Configuration for the copy operation
 */
const config = {
  // Source directory (Vite's build output)
  sourceDir: path.resolve('./dist'),
  
  // Destination directory (Backend's public folder)
  destDir: path.resolve('./backend/public'),
  
  // List of directories/files to be excluded from copy
  exclude: ['node_modules', '.git'],
  
  // Clean the destination directory before copying
  cleanDest: true,
  
  // Whether to preserve file timestamps
  preserveTimestamps: true,
};

/**
 * Copies the Vite build output to the backend's public directory
 */
async function copyBuildToBackend() {
  console.log(chalk.blue('🚀 Starting copy process...'));
  
  try {
    // Ensure source directory exists
    if (!fs.existsSync(config.sourceDir)) {
      throw new Error(`Source directory not found: ${config.sourceDir}`);
    }
    
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(config.destDir)) {
      console.log(chalk.yellow(`Creating destination directory: ${config.destDir}`));
      fs.mkdirSync(config.destDir, { recursive: true });
    } else if (config.cleanDest) {
      // Clean destination directory if configured
      console.log(chalk.yellow(`Cleaning destination directory: ${config.destDir}`));
      fs.emptyDirSync(config.destDir);
    }
    
    // Log copy operation details
    console.log(chalk.cyan(`Copying from: ${config.sourceDir}`));
    console.log(chalk.cyan(`Copying to: ${config.destDir}`));
    
    // Copy files
    await fs.copy(config.sourceDir, config.destDir, {
      filter: (src) => {
        // Skip excluded directories/files
        const relativePath = path.relative(config.sourceDir, src);
        return !config.exclude.some(pattern => 
          relativePath.startsWith(pattern) || 
          relativePath.includes(`/${pattern}`)
        );
      },
      preserveTimestamps: config.preserveTimestamps,
      recursive: true,
    });
    
    console.log(chalk.green('✅ Build files successfully copied to backend!'));
    
    // Verify the index.html file exists in the destination
    const indexPath = path.join(config.destDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log(chalk.green('✅ index.html verified in the public directory'));
    } else {
      console.log(chalk.red('⚠️ Warning: index.html not found in the public directory!'));
      console.log(chalk.yellow('This may cause issues with your SPA routing.'));
    }
    
    // Check for assets directory
    const assetsPath = path.join(config.destDir, 'assets');
    if (fs.existsSync(assetsPath)) {
      const assetFiles = fs.readdirSync(assetsPath);
      console.log(chalk.green(`✅ Assets directory contains ${assetFiles.length} files`));
    }
    
    // Additional check for route configuration file if it exists
    const routesConfigPath = path.join(config.destDir, 'routes-manifest.json');
    if (fs.existsSync(routesConfigPath)) {
      console.log(chalk.green('✅ Routes configuration file found'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error copying build files:'), error.message);
    process.exit(1);
  }
}

// Run the copy process
copyBuildToBackend();