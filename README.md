# xrdPlot

**xrdPlot** is a web-based visualization tool for X-ray Diffraction (XRD) data. Built using **Next.js** and styled with **Tailwind CSS**, the app provides researchers with a fast and interactive platform to upload and plot `.xy` XRD files (2θ vs Intensity).

📡 **Live Deployment**: [https://xrdplot.onrender.com](https://xrdplot.onrender.com)  
📦 **GitHub Repo**: [https://github.com/raymsm/xrdPlot](https://github.com/raymsm/xrdPlot)

---

## 🧩 Features

- 📁 Upload XRD `.xy` files (angle vs intensity)
- 📈 Interactive plotting of XRD patterns
- 💡 Clean and minimal user interface
- ⚡ Built with modern frontend tech stack (Next.js + Tailwind)
- 🌐 Deployed on [Render](https://render.com)

---

## 🛠️ Tech Stack

| Tool         | Purpose              |
|--------------|----------------------|
| **Next.js**  | React Framework      |
| **Tailwind** | Utility-first CSS    |
| **TypeScript** | Type-safe coding   |
| **Render**   | Hosting/Deployment   |

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16
- npm or yarn

### Installation

```bash
git clone https://github.com/raymsm/xrdPlot.git
cd xrdPlot
npm install
# or
yarn install
Run Locally
bash
Copy
Edit
npm run dev
# or
yarn dev
Visit http://localhost:3000 in your browser.

📄 Usage
Launch the web app.

Drag & drop or upload your .xy XRD file.

View the interactive plot (angle vs intensity).

Use zoom and pan controls for detailed exploration.

Sample .xy File Format
python-repl
Copy
Edit
20.0    123
20.1    135
20.2    140
...
Ensure no headers and use space/tab-separated format.

📁 Project Structure
bash
Copy
Edit
xrdPlot/
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js pages
│   ├── components/     # Reusable UI components
│   ├── styles/         # Tailwind CSS and custom styles
├── tailwind.config.ts  # Tailwind configuration
├── next.config.js      # Next.js configuration
📤 Deployment
This app is deployed on Render:

Build Command: npm run build

Start Command: npm start

Node Version: defined in .nvmrc or via Render settings

📜 License
This project is licensed under the MIT License.
See the LICENSE file for details.

📬 Contact
For questions, feedback, or collaboration:

GitHub: @raymsm

Email: raymsm@example.com

xrdPlot is part of a growing suite of open-source tools to support materials research and XRD-based analysis.

kotlin
Copy
Edit

Let me know if you want this adapted for GitHub Pages, Docker deployment, or extended CI/CD integration.
