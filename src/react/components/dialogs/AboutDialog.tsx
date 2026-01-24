/**
 * About dialog showing application information.
 * Mirrors the legacy show_about_paint() function structure.
 */
import { useTranslation } from "react-i18next";
import { Dialog, DialogButtons } from "./Dialog";

export interface AboutDialogProps {
	isOpen: boolean;
	onClose: () => void;
}

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
	const { t } = useTranslation();
	return (
		<Dialog title={t("About Paint")} isOpen={isOpen} onClose={onClose} width={420} icon="/images/icons/16x16.png" className="dialog-window about-paint-window">
			<div className="about-paint-content">
				<div className="about-paint-header">
					<img src="/images/icons/128x128.png" width={128} height={128} className="about-paint-icon" alt="" />
					<div className="about-paint-beside-icon">
						<h1 className="about-project-name">JS Paint</h1>
						<div className="about-version">{t("Version")} 1.0.0+</div>
					</div>
					<button className="about-whats-new-button">{t("What's New?")}</button>
				</div>
				<p>
					{t("MS Paint remake by")}{" "}
					<a href="https://isaiahodhner.io/" target="_blank" rel="noopener noreferrer">
						Isaiah Odhner
					</a>
				</p>
				<p>
					{t("Feedback:")}{" "}
					<a href="https://github.com/evgenyvinnik/mcpaint/issues" target="_blank" rel="noopener noreferrer">
						GitHub
					</a>
				</p>
				<p>
					<a href="/about.html" target="_blank" rel="noopener noreferrer">
						{t("Homepage")}
					</a>
					{" · "}
					<a
						href="https://github.com/evgenyvinnik/mcpaint/blob/master/LICENSE.txt"
						target="_blank"
						rel="noopener noreferrer"
					>
						{t("MIT License")}
					</a>
					{" · "}
					<a href="/privacy.html" target="_blank" rel="noopener noreferrer">
						{t("Privacy Policy")}
					</a>
				</p>
			</div>
			<DialogButtons>
				<button className="about-ok-button" onClick={onClose} autoFocus>
					{t("OK")}
				</button>
			</DialogButtons>
		</Dialog>
	);
}

export default AboutDialog;
