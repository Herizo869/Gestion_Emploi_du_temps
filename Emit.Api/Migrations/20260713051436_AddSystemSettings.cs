using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Emit.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EtablissementNom = table.Column<string>(type: "text", nullable: false),
                    EtablissementSousTitre = table.Column<string>(type: "text", nullable: false),
                    EmailEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    SmtpHost = table.Column<string>(type: "text", nullable: false),
                    SmtpPort = table.Column<int>(type: "integer", nullable: false),
                    SmtpUser = table.Column<string>(type: "text", nullable: false),
                    SmtpPass = table.Column<string>(type: "text", nullable: false),
                    FromEmail = table.Column<string>(type: "text", nullable: false),
                    FromName = table.Column<string>(type: "text", nullable: false),
                    LoginUrl = table.Column<string>(type: "text", nullable: false),
                    PwdMinLength = table.Column<int>(type: "integer", nullable: false),
                    PwdRequireUppercase = table.Column<bool>(type: "boolean", nullable: false),
                    PwdRequireDigit = table.Column<bool>(type: "boolean", nullable: false),
                    PwdRequireSpecial = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SystemSettings");
        }
    }
}
