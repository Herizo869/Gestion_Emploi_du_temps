using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Emit.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDomaineToFiliere : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Domaine",
                table: "Filieres",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Domaine",
                table: "Filieres");
        }
    }
}
