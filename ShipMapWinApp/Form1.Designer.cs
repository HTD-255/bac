namespace ShipMapWinApp;

partial class Form1
{
    /// <summary>
    ///  Required designer variable.
    /// </summary>
    private System.ComponentModel.IContainer components = null;

    /// <summary>
    ///  Clean up any resources being used.
    /// </summary>
    /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
    protected override void Dispose(bool disposing)
    {
        if (disposing && (components != null))
        {
            components.Dispose();
        }
        base.Dispose(disposing);
    }

    #region Windows Form Designer generated code

    /// <summary>
    ///  Required method for Designer support - do not modify
    ///  the contents of this method with the code editor.
    /// </summary>
    private Microsoft.Web.WebView2.WinForms.WebView2 webView21;
    private Button buttonAddShip;
    private Panel panelToolbar;
    private Label labelTitle;

    private void InitializeComponent()
    {
        this.components = new System.ComponentModel.Container();
        this.webView21 = new Microsoft.Web.WebView2.WinForms.WebView2();
        this.panelToolbar = new Panel();
        this.labelTitle = new Label();
        this.buttonAddShip = new Button();
        ((System.ComponentModel.ISupportInitialize)(this.webView21)).BeginInit();
        this.SuspendLayout();
        
        // panelToolbar
        this.panelToolbar.BackColor = System.Drawing.SystemColors.Control;
        this.panelToolbar.Controls.Add(this.buttonAddShip);
        this.panelToolbar.Controls.Add(this.labelTitle);
        this.panelToolbar.Dock = System.Windows.Forms.DockStyle.Top;
        this.panelToolbar.Location = new System.Drawing.Point(0, 0);
        this.panelToolbar.Name = "panelToolbar";
        this.panelToolbar.Size = new System.Drawing.Size(1400, 50);
        this.panelToolbar.TabIndex = 1;
        
        // labelTitle
        this.labelTitle.AutoSize = true;
        this.labelTitle.Font = new System.Drawing.Font("Segoe UI", 14F, System.Drawing.FontStyle.Bold);
        this.labelTitle.Location = new System.Drawing.Point(10, 12);
        this.labelTitle.Name = "labelTitle";
        this.labelTitle.Size = new System.Drawing.Size(250, 25);
        this.labelTitle.TabIndex = 1;
        this.labelTitle.Text = "Bản đồ nhật ký tàu cá";
        
        // buttonAddShip
        this.buttonAddShip.Location = new System.Drawing.Point(270, 10);
        this.buttonAddShip.Name = "buttonAddShip";
        this.buttonAddShip.Size = new System.Drawing.Size(120, 30);
        this.buttonAddShip.TabIndex = 0;
        this.buttonAddShip.Text = "Add Ship";
        this.buttonAddShip.UseVisualStyleBackColor = true;
        this.buttonAddShip.Click += new System.EventHandler(this.ButtonAddShip_Click);
        
        // webView21
        this.webView21.CreationProperties = null;
        this.webView21.DefaultBackgroundColor = System.Drawing.Color.White;
        this.webView21.Dock = System.Windows.Forms.DockStyle.Fill;
        this.webView21.Location = new System.Drawing.Point(0, 50);
        this.webView21.Name = "webView21";
        this.webView21.Size = new System.Drawing.Size(1400, 850);
        this.webView21.TabIndex = 0;
        this.webView21.ZoomFactor = 1D;
        
        // Form1
        this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 15F);
        this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
        this.ClientSize = new System.Drawing.Size(1400, 900);
        this.Controls.Add(this.webView21);
        this.Controls.Add(this.panelToolbar);
        this.Name = "Form1";
        this.Text = "Ship Map";
        this.WindowState = System.Windows.Forms.FormWindowState.Maximized;
        this.Load += new System.EventHandler(this.Form1_Load);
        ((System.ComponentModel.ISupportInitialize)(this.webView21)).EndInit();
        this.ResumeLayout(false);
    }

    #endregion
}
