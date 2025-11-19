namespace ShipMapWinApp;

public partial class Form1 : Form
{
    public Form1()
    {
        InitializeComponent();
    }

    private async void Form1_Load(object sender, EventArgs e)
    {
        try
        {
            // Initialize WebView2
            await webView21.EnsureCoreWebView2Async(null);
            
            // Navigate to the URL
            webView21.CoreWebView2.Navigate("http://157.66.100.146:5173/");
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Error loading WebView2: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private void ButtonAddShip_Click(object sender, EventArgs e)
    {
        webView21.CoreWebView2.Navigate("hhttp://157.66.100.146:5173/add-ship");
    }
}
