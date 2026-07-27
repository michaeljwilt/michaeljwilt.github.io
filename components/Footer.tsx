export default function Footer() {
  return (
    <footer id="footer">
      <div className="container footer-inner">
        <span className="mono" suppressHydrationWarning>
          © {new Date().getFullYear()} Michael Wilt
        </span>
        <span className="mono footer-note">Built by hand. Powered by curiosity.</span>
      </div>
    </footer>
  );
}
