# b1.makeup

This project is deployed to [b1.makeup](https://b1.makeup)

## Deployment

The site is automatically deployed to GitHub Pages using GitHub Actions whenever changes are pushed to the `main` branch.

### Custom Domain Setup

The custom domain `b1.makeup` is configured via the `CNAME` file in the repository root.

To complete the deployment:
1. Ensure GitHub Pages is enabled in the repository settings
2. Set the source to "GitHub Actions"
3. Configure DNS records for b1.makeup to point to GitHub Pages:
   - Add a CNAME record pointing to `boyulvy.github.io`
   - Or add A records pointing to GitHub Pages IP addresses

### Manual Deployment

You can manually trigger a deployment by going to the Actions tab and running the "Deploy to GitHub Pages" workflow.