import fitz # PyMuPDF
import os

pdf_files = {
    'home': 'home page.pdf',
    'events': 'image 3.pdf',
    'streams': 'image 4.pdf',
    'login': 'login page.pdf'
}

os.makedirs('public/images/references', exist_ok=True)
os.makedirs('public/images/movies', exist_ok=True)
os.makedirs('public/images/events', exist_ok=True)
os.makedirs('public/images/streams', exist_ok=True)
os.makedirs('public/images/backgrounds', exist_ok=True)

for key, filename in pdf_files.items():
    if not os.path.exists(filename):
        print(f"File not found: {filename}")
        continue
    doc = fitz.open(filename)
    print(f"\nProcessing {filename} (pages: {len(doc)}):")
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        # Render high-res page image (scale 2.0)
        pix = page.get_pixmap(dpi=150)
        out_page_path = f"public/images/references/{key}_page_{page_idx+1}.png"
        pix.save(out_page_path)
        print(f"Saved page render to {out_page_path} ({pix.width}x{pix.height})")
        
        # Check embedded images
        image_list = page.get_images(full=True)
        print(f"Embedded images on page {page_idx+1}: {len(image_list)}")
        for img_idx, img_info in enumerate(image_list):
            xref = img_info[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            img_path = f"public/images/references/{key}_img_{img_idx}_{xref}.{image_ext}"
            with open(img_path, "wb") as f:
                f.write(image_bytes)
            print(f"  Extracted image {img_idx}: {img_path} ({base_image['width']}x{base_image['height']})")

print("Done extracting!")
