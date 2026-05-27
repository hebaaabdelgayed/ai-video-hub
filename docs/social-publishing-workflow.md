# Social Publishing Workflow

This workflow keeps generated social images reusable across LinkedIn, Facebook, and YouTube Community posts.

## Why This Exists

Composio's LinkedIn post tool does not accept normal Windows file paths as image attachments. It expects its own stored file key for image uploads. That makes one-off local image uploads fragile.

The stable solution is to make every social visual available at a public site URL. Facebook can use that URL directly. LinkedIn can download that URL inside Composio's remote environment and turn it into the stored file key the LinkedIn connector expects. YouTube Community remains a manual or browser-assisted upload because YouTube does not expose a public Community-post creation API.

## Recommended Flow

1. Generate or choose the social visual.
2. Prepare it as a source-controlled site asset:

```powershell
node scripts/prepare-social-asset.mjs "C:\path\to\image.png" ai-iq-linkedin
```

3. Run the site build:

```powershell
node scripts/build.mjs
```

4. Deploy the site through GitHub Pages.
5. Use the generated public URL in the publishing workflow:

```text
https://hebaahmedai.cloud/social-assets/ai-iq-linkedin.png
```

6. When the topic deserves SEO value, add the same idea as a website article in `data/posts.json` and use the infographic as the article image. Then the website article becomes the permanent source link for LinkedIn, Facebook, and YouTube Community.

## Platform Handling

### LinkedIn

Use the public image URL as the bridge into Composio:

1. Download the public image URL inside Composio remote workbench.
2. Upload that downloaded file with Composio's `upload_local_file(...)` helper.
3. Use the returned `{ name, mimetype, s3key }` object in `LINKEDIN_CREATE_LINKED_IN_POST`.

### Facebook Page

Use `FACEBOOK_CREATE_PHOTO_POST` with:

- `page_id`
- `message`
- `url`: the public image URL

If Facebook rejects the URL, confirm the URL opens directly as an image over HTTPS and returns an image MIME type, not an HTML preview page.

### YouTube Community

Use the same square image file, but publish through the YouTube interface unless a separate scheduling service is connected. YouTube's public Data API does not provide a normal endpoint for creating Community posts.

## Google Drive Alternative

Google Drive can also be used as the permanent staging layer.

Use this when you want to publish quickly without waiting for the website deployment.

1. Upload the image to a Drive folder such as `Social Posts`.
2. Set sharing to `Anyone with the link can view`.
3. Copy the Drive file link.
4. Convert it to a direct-download link:

```text
https://drive.google.com/uc?export=download&id=FILE_ID
```

Example:

```text
Preview link:
https://drive.google.com/file/d/1abcDEF123/view?usp=sharing

Direct-download link:
https://drive.google.com/uc?export=download&id=1abcDEF123
```

5. In Composio/LinkedIn:
   - Download the direct Drive URL inside the remote workbench.
   - Upload the downloaded file with Composio's `upload_local_file(...)` helper.
   - Publish the post with the returned `{ name, mimetype, s3key }` object.

Drive is convenient for manual work, but the website asset URL is more reliable long term because it is a normal public static file URL.

## Naming Rule

Use short English slugs:

```text
ai-iq-linkedin
gemini-files-update
claude-word-addin
```

## Practical Notes

- Keep square images around 1080x1080 for Facebook, LinkedIn, and YouTube Community.
- Use `.jpg` for smaller file size when possible.
- Keep the original generated image in its original generated-images folder.
- Put only reusable social-ready copies under `src/social-assets`.
- Do not place private analytics, secrets, or unpublished private files in this folder because it becomes public after deployment.
