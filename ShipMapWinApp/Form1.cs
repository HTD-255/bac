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
            webView21.CoreWebView2.Navigate("http://161.248.147.115/");
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Error loading WebView2: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private void ButtonAddShip_Click(object sender, EventArgs e)
    {
        webView21.CoreWebView2.Navigate("http://161.248.147.115/add-ship");
    }
}
