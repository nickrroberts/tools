# Exit immediately if any command fails
set -e

# 1. Make sure we're on main
git checkout main

# 2. Build the project
npm install
npm run build

# 3. Push any changes on main``
git add .
git commit -m "Build for deployment" || echo "No changes to commit."
git push origin main

# 4. Switch to gh-pages branch
git checkout gh-pages

# 5. Remove everything (except .git directory)
find . -mindepth 1 ! -name '.git' ! -path './.git/*' -exec rm -rf {} +

# 6. Copy dist contents into the root
cp -r dist/* .

# 7. Remove the dist folder
rm -rf dist

# 8. Add, commit, and push
git add .
git commit -m "Deploy new build to GitHub Pages"
git push origin gh-pages

# 9. Switch back to main
git checkout main

echo "Deployment complete!"